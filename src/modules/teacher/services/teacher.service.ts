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
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { TeacherEntity } from '../entities/teacher.entity';
import { CreateTeacherDto, TeacherDto, UpdateTeacherDto } from '../dto/teacher.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ClassService } from '../../class/services/class.service';
import { DailyScheduleEntity } from '../../daily-schedule/entities/daily-schedule.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(TeacherEntity)
    private readonly repository: Repository<TeacherEntity>,
    @InjectRepository(DailyScheduleEntity)
    private readonly dailyScheduleRepository: Repository<DailyScheduleEntity>,
    private readonly classService: ClassService,
  ) {}

  async save(entity: TeacherEntity): Promise<TeacherEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateTeacherDto): Promise<TeacherEntity> {
    const classes = await this.classService.findByIds(dto.classIds);

    const newEntity = plainToClass(TeacherEntity, { ...dto, classes });

    const teacher = await this.repository.save(newEntity);

    const teacherId = teacher.id;

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
      if (!sched.students.find((s) => s.id === teacherId)) {
        sched.teachers.push(teacher);
        this.dailyScheduleRepository.save(sched);
      }
    }

    return teacher;
  }

  async findAll(campusId?: number): Promise<any[]> {
    const query = this.repository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.campus', 'campus')
      .leftJoinAndSelect('teacher.classes', 'class')
      .select([
        'teacher',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phone',
        'user.image',
        'user.role',
        'campus.id',
        'campus.name',
        'class.id',
        'class.name',
      ]);

    if (campusId) {
      query.where('campus.id = :campusId', { campusId });
    }

    const teachers = await query.getMany();

    for (const teacher of teachers) {
      if (teacher.user) {
        delete (teacher.user as any).password;

        if ((teacher.user as any).tempPassword) {
          delete (teacher.user as any).tempPassword;
        }
      }
    }

    return teachers;
  }

  async findOne(id: number): Promise<TeacherEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['user', 'campus', 'classes'],
    });
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<TeacherEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: relations,
    });
  }

  async findOneByUserId(userId: number, relations: string[]): Promise<TeacherEntity | null> {
    return await this.repository.findOne({
      where: { user: { id: userId } },
      relations: relations,
    });
  }

  async update(id: number, updateData: UpdateTeacherDto): Promise<void> {
    if (updateData.classIds) {
      const teacher = await this.repository.findOne({
        where: { id },
        relations: ['classes', 'dailySchedules'],
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const classes = await this.classService.findByIds(updateData.classIds);

      const removedClasses = teacher.classes.filter((oldC) => !classes.some((newC) => newC.id === oldC.id));

      teacher.classes = classes;

      await this.repository.save(teacher);

      const teacherId = teacher.id;

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
        if (!sched.teachers.find((s) => s.id === teacherId)) {
          sched.teachers.push(teacher);
          await this.dailyScheduleRepository.save(sched);
        }
      }

      for (const removedClass of removedClasses) {
        const schedulesToRemove = await this.dailyScheduleRepository.find({
          where: {
            planning: { class: { id: removedClass.id } },
            teachers: { id: teacherId },
          },
        });

        for (const sched of schedulesToRemove) {
          sched.teachers = sched.teachers.filter((s) => s.id !== teacherId);
          await this.dailyScheduleRepository.save(sched);
        }
      }

      delete updateData.classIds;
    }

    const updateResult = await this.repository.update({ id }, plainToClass(TeacherEntity, updateData));
    if (updateResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
    // const teacher = await this.repository.findOne({
    //   where: { id },
    //   relations: ['user'],
    // });

    // if (!teacher) {
    //   throw new NotFoundException('Teacher not found');
    // }

    // const { user: userData, ...teacherData } = updateData;

    // Object.assign(teacher, teacherData);

    // if (userData) {
    //   Object.assign(teacher.user, userData);
    // }

    // await this.repository.save(teacher);
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async findByIds(ids: number[]): Promise<TeacherEntity[]> {
    return await this.repository.find({ where: { id: In(ids) }, relations: ['user', 'campus', 'classes'] });
  }

  async findByClassId(classId: number): Promise<TeacherEntity[]> {
    return await this.repository.find({ where: { classes: { id: classId } }, relations: ['user'] });
  }
}
