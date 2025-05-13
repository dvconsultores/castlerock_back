import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { CreateStudentDto, FindStudentDtoQuery, UpdateStudentDto } from '../dto/student.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { ContactPersonEntity } from '../entities/contact-person.entity';
import { StorageService } from '../../../shared/storage/storage.service';
import { Multer } from 'multer';
import { AdditionalProgramService } from '../../additional-program/services/additional-program.service';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repository: Repository<StudentEntity>,
    @InjectRepository(ContactPersonEntity)
    private readonly contactPersonRepository: Repository<ContactPersonEntity>,
    private readonly storageService: StorageService,
    private readonly additionalProgramService: AdditionalProgramService,
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

      const newEntity = plainToClass(StudentEntity, {
        ...dto,
        additionalPrograms,
      });

      const saved = await this.repository.save(newEntity);

      return instanceToPlain(saved);
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async findByParams(query: FindStudentDtoQuery): Promise<any[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .leftJoinAndSelect('student.contacts', 'contacts')
      .select(['student', 'campus.id', 'campus.name']);

    if (query.campusId) {
      queryBuilder.where('campus.id = :campusId', { campusId: query.campusId });
    }

    if (query.dayEnrolled) {
      queryBuilder.andWhere('student.daysEnrolled LIKE :pattern', {
        pattern: `%${query.dayEnrolled}%`,
      });
    }

    const students = await queryBuilder.getMany();
    return students.map((student) => instanceToPlain(student));
  }

  async findOne(id: number): Promise<any> {
    const student = await this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .leftJoinAndSelect('student.contacts', 'contacts')
      .select(['student', 'campus.id', 'campus.name'])
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
        await this.contactPersonRepository.delete({ student: { id } });

        if (imageContactPrimary) {
          const contactPrimary = contacts.find((contact) => contact.role === 'PRIMARY');

          if (contactPrimary) {
            contactPrimary.image = await this.storageService.upload(imageContactPrimary);
          }

          const contactPrimaryEntity = plainToClass(ContactPersonEntity, {
            ...contactPrimary,
            image: await this.storageService.upload(imageContactPrimary),
          });

          const contactPrimaryIndex = contacts.findIndex((contact) => contact.role === 'PRIMARY');

          if (contactPrimaryIndex !== -1) {
            contacts[contactPrimaryIndex] = contactPrimaryEntity;
          }
        }

        if (imageContactSecondary) {
          const contactSecondary = contacts.find((contact) => contact.role === 'SECONDARY');

          if (contactSecondary) {
            contactSecondary.image = await this.storageService.upload(imageContactSecondary);
          }

          const contactSecondaryEntity = plainToClass(ContactPersonEntity, {
            ...contactSecondary,
            image: await this.storageService.upload(imageContactSecondary),
          });

          const contactSecondaryIndex = contacts.findIndex((contact) => contact.role === 'SECONDARY');

          if (contactSecondaryIndex !== -1) {
            contacts[contactSecondaryIndex] = contactSecondaryEntity;
          }
        }

        student.contacts = contacts.map((contact) =>
          plainToClass(ContactPersonEntity, {
            ...contact,
            student: { id },
          }),
        );
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
}
