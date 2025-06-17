import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { CreateStudentDto, FindStudentDtoQuery, UpdateStudentDto } from '../dto/student.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { ContactPersonEntity } from '../entities/contact-person.entity';
import { StorageService } from '../../../shared/storage/storage.service';
import { Multer } from 'multer';
import { AdditionalProgramService } from '../../additional-program/services/additional-program.service';
import { ProgramType } from '../../../shared/enums/program-type.enum';
import { ClassService } from '../../class/services/class.service';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { DailyScheduleEntity } from '../../daily-schedule/entities/daily-schedule.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repository: Repository<StudentEntity>,
    @InjectRepository(ContactPersonEntity)
    private readonly contactPersonRepository: Repository<ContactPersonEntity>,
    private readonly storageService: StorageService,
    private readonly additionalProgramService: AdditionalProgramService,
    private readonly classService: ClassService,
    @InjectRepository(DailyScheduleEntity)
    private readonly dailyScheduleRepository: Repository<DailyScheduleEntity>,
  ) {}

  async save(entity: StudentEntity): Promise<StudentEntity> {
    return await this.repository.save(entity);
  }

  async create(
    dto: CreateStudentDto,
    image?: Multer.File,
    imageContactPrimary?: Multer.File,
    imageContactSecondary?: Multer.File,
  ): Promise<any> {
    try {
      if (image) {
        const imageUrl = await this.storageService.upload(image);
        dto.image = imageUrl;
      }

      if (imageContactPrimary) {
        const index = dto.contacts.findIndex((contact) => contact.role === 'PRIMARY');
        if (index !== -1) {
          const uploaded = await this.storageService.upload(imageContactPrimary);
          dto.contacts[index].image = uploaded;
        }
      }

      if (imageContactSecondary) {
        const index = dto.contacts.findIndex((contact) => contact.role === 'SECONDARY');
        if (index !== -1) {
          const uploaded = await this.storageService.upload(imageContactSecondary);
          dto.contacts[index].image = uploaded;
        }
      }

      const additionalPrograms = await this.additionalProgramService.findByIds(dto.additionalProgramIds);

      const classes = await this.classService.findByIds(dto.classIds);

      const newEntity = plainToClass(StudentEntity, {
        ...dto,
        classes,
        additionalPrograms,
      });

      const student = await this.repository.save(newEntity);

      const studentId = student.id;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureSchedules = await this.dailyScheduleRepository.find({
        where: {
          planning: { class: { id: In(dto.classIds) } },
          date: MoreThanOrEqual(today),
        },
        relations: ['students'],
      });

      for (const sched of futureSchedules) {
        if (!sched.students.find((s) => s.id === studentId)) {
          sched.students.push(student);
          await this.dailyScheduleRepository.save(sched);
        }
      }

      return instanceToPlain(student);
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async findByParams(query: FindStudentDtoQuery): Promise<any[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .leftJoinAndSelect('student.contacts', 'contacts')
      .leftJoinAndSelect('student.additionalPrograms', 'additionalPrograms')
      .leftJoinAndSelect('student.classes', 'classes')
      .select(['student', 'campus.id', 'campus.name', 'contacts', 'additionalPrograms', 'classes']);

    if (query.campusId) {
      queryBuilder.where('campus.id = :campusId', { campusId: query.campusId });
    }

    if (query.dayEnrolled) {
      queryBuilder.andWhere('student.daysEnrolled LIKE :pattern', {
        pattern: `%${query.dayEnrolled}%`,
      });
    }

    if (query.program) {
      const ageInMonthsExpr = `
        (EXTRACT(YEAR FROM AGE(NOW(), student.dateOfBirth)) * 12 +
        EXTRACT(MONTH FROM AGE(NOW(), student.dateOfBirth)))
      `;

      queryBuilder.addSelect(ageInMonthsExpr, 'student_age_in_months');

      if (query.program === ProgramType.TODDLER) {
        console.log('TODDLER');
        queryBuilder.andWhere(`${ageInMonthsExpr} > 24`);
      } else if (query.program === ProgramType.PRIMARY) {
        console.log('PRIMARY');
        queryBuilder.andWhere(`${ageInMonthsExpr} <= 24`);
      }
    }

    const students = await queryBuilder.getMany();
    return students.map((student) => instanceToPlain(student));
  }

  async findOne(id: number): Promise<any> {
    const student = await this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .leftJoinAndSelect('student.contacts', 'contacts')
      .leftJoinAndSelect('student.additionalPrograms', 'additionalPrograms')
      .leftJoinAndSelect('student.classes', 'classes')
      .select(['student', 'campus.id', 'campus.name', 'contacts', 'additionalPrograms', 'classes'])
      .where('student.id = :id', { id })
      .getOne();

    return student ? instanceToPlain(student) : null;
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<any> {
    const student = await this.repository.findOne({
      where: { id },
      relations,
    });

    return student ? instanceToPlain(student) : null;
  }

  async update(
    id: number,
    updateData: UpdateStudentDto,
    image?: Multer.File,
    imageContactPrimary?: Multer.File,
    imageContactSecondary?: Multer.File,
  ): Promise<void> {
    try {
      const student = await this.repository.findOne({ where: { id } });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      let imageUrl: string | undefined;

      if (image) {
        imageUrl = await this.storageService.upload(image);
        updateData.image = imageUrl;
      }

      const { contacts, ...rest } = updateData;
      Object.assign(student, rest);

      if (contacts) {
        const rolesInPayload = contacts.map((c) => c.role);

        await this.contactPersonRepository.delete({
          student: { id },
          role: Not(In(rolesInPayload)),
        });

        for (const contactData of contacts) {
          const { role } = contactData;

          if (role === 'PRIMARY' && imageContactPrimary) {
            contactData.image = await this.storageService.upload(imageContactPrimary);
          } else if (role === 'SECONDARY' && imageContactSecondary) {
            contactData.image = await this.storageService.upload(imageContactSecondary);
          }

          let existingContact = await this.contactPersonRepository.findOne({
            where: {
              student: { id },
              role,
            },
          });

          if (existingContact) {
            Object.assign(existingContact, {
              ...contactData,
              student: { id },
            });
            await this.contactPersonRepository.save(existingContact);
          } else {
            const newContact = plainToClass(ContactPersonEntity, {
              ...contactData,
              student: { id },
            });
            await this.contactPersonRepository.save(newContact);
          }
        }
      }

      if (updateData.additionalProgramIds) {
        const additionalPrograms = await this.additionalProgramService.findByIds(updateData.additionalProgramIds);
        student.additionalPrograms = additionalPrograms;
      }

      if (updateData.classIds) {
        const classes = await this.classService.findByIds(updateData.classIds);
        student.classes = classes;

        const studentId = student.id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureSchedules = await this.dailyScheduleRepository.find({
          where: {
            planning: { class: { id: In(updateData.classIds) } },
            date: MoreThanOrEqual(today),
          },
          relations: ['students'],
        });

        for (const sched of futureSchedules) {
          if (!sched.students.find((s) => s.id === studentId)) {
            sched.students.push(student);
            await this.dailyScheduleRepository.save(sched);
          }
        }
      }

      await this.repository.save(student);
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Student not found');
    }
  }

  async findByIds(ids: number[]): Promise<StudentEntity[]> {
    const students = await this.repository.findBy({ id: In(ids) });

    return students.map((student) => instanceToPlain(student)) as StudentEntity[];
  }

  async findByClassIdAndDayEnrolled(classId: number, day: WeekDayEnum): Promise<StudentEntity[]> {
    const students = await this.repository.find({ where: { classes: { id: classId }, daysEnrolled: In([day]) } });

    return students.map((student) => instanceToPlain(student)) as StudentEntity[];
  }
}
