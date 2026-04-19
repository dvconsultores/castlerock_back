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
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';

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

  async create(user: AuthUser, dto: CreateTeacherDto): Promise<TeacherEntity> {
    if (user.campusId !== dto.campus) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const classes = await this.classService.findByIds(dto.classIds, user.campusId);

    const newEntity = plainToClass(TeacherEntity, { ...dto, classes });

    const teacher = await this.repository.save(newEntity);

    const teacherId = teacher.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureSchedules = await this.dailyScheduleRepository.find({
      where: {
        planning: { class: { id: In(dto.classIds), campus: { id: user.campusId } } },
        date: MoreThanOrEqual(today),
      },
      relations: ['teachers'],
    });

    const savePromises = futureSchedules
      .filter((sched) => !sched.teachers.some((t) => t.id === teacherId))
      .map((sched) => {
        sched.teachers.push(teacher);
        return this.dailyScheduleRepository.save(sched);
      });

    await Promise.all(savePromises);

    return teacher;
  }

  async findAll(user: AuthUser): Promise<any[]> {
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

    if (user.campusId) {
      query.where('campus.id = :campusId', { campusId: user.campusId });
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

  async findOne(user: AuthUser, id: number): Promise<TeacherEntity | null> {
    return await this.repository.findOne({
      where: { id, campus: { id: user.campusId } },
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

  async update(user: AuthUser, id: number, updateData: UpdateTeacherDto): Promise<void> {
    if (updateData.classIds !== undefined && updateData.classIds.length >= 0) {
      const teacher = await this.repository.findOne({
        where: { id, campus: { id: user.campusId } },
        relations: ['classes'],
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const classes = updateData.classIds ? await this.classService.findByIds(updateData.classIds, user.campusId) : [];

      const removedClasses = teacher.classes.filter((oldC) => !classes.some((newC) => newC.id === oldC.id));

      const teacherId = teacher.id;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureSchedules = await this.dailyScheduleRepository.find({
        where: {
          planning: { class: { id: In(classes.map((c) => c.id)), campus: { id: user.campusId } } },
          date: MoreThanOrEqual(today),
        },
        relations: ['teachers'],
      });

      const addPromises = futureSchedules
        .filter((sched) => !sched.teachers.some((t) => t.id === teacherId))
        .map((sched) => {
          sched.teachers.push(teacher);
          return this.dailyScheduleRepository.save(sched);
        });

      const removePromises: Promise<any>[] = [];

      for (const removedClass of removedClasses) {
        const schedulesToRemove = await this.dailyScheduleRepository
          .createQueryBuilder('ds')
          .innerJoin('ds.planning', 'pl')
          .andWhere('pl.classId = :removedClassId', { removedClassId: removedClass.id })
          .innerJoin('ds.teachers', 's_filter', 's_filter.id = :teacherId', { teacherId })
          .leftJoinAndSelect('ds.teachers', 'allTeachers')
          .andWhere('pl.campus.id = :campusId', { campusId: user.campusId })
          .getMany();

        schedulesToRemove.forEach((sched) => {
          sched.teachers = sched.teachers.filter((t) => t.id !== teacherId);
          removePromises.push(this.dailyScheduleRepository.save(sched));
        });
      }

      await Promise.all([...addPromises, ...removePromises]);

      teacher.classes = classes;

      this.save(teacher);

      delete updateData.classIds;
    }

    const updateResult = await this.repository.update(
      { id, campus: { id: user.campusId } },
      plainToClass(TeacherEntity, updateData),
    );
    if (updateResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async remove(user: AuthUser, id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id, campus: { id: user.campusId } });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async findByIds(ids: number[], campusId: number): Promise<TeacherEntity[]> {
    return await this.repository.find({
      where: { id: In(ids), campus: { id: campusId } },
      relations: ['user', 'campus', 'classes'],
    });
  }

  async findByClassId(classId: number): Promise<TeacherEntity[]> {
    return await this.repository.find({ where: { classes: { id: classId } }, relations: ['user'] });
  }
}
