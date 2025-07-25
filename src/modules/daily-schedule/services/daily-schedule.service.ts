import {
  BadRequestException,
  ForbiddenException,
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
import { CreateDailyScheduleDto, UpdateDailyScheduleDto } from '../dto/daily-schedule.dto';
import { plainToClass } from 'class-transformer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { DailyScheduleEntity } from '../entities/daily-schedule.entity';
import { addDays, format, formatISO } from 'date-fns';
import { PlanningService } from '../../planning/services/planning.service';
import { TeacherService } from '../../teacher/services/teacher.service';
import { StudentService } from '../../student/services/student.service';
import { NotificationService } from '../../notification/services/notification.service';

@Injectable()
export class DailyScheduleService {
  constructor(
    @InjectRepository(DailyScheduleEntity)
    private readonly dailyScheduleRepository: Repository<DailyScheduleEntity>,
    @Inject(forwardRef(() => PlanningService))
    private readonly planningService: PlanningService,
    private readonly teacherService: TeacherService,
    private readonly studentService: StudentService,
    private readonly notificationService: NotificationService,
  ) {}

  async save(entity: DailyScheduleEntity): Promise<DailyScheduleEntity> {
    return await this.dailyScheduleRepository.save(entity);
  }

  async create(dto: CreateDailyScheduleDto, adminId: number): Promise<DailyScheduleEntity> {
    try {
      const dailyScheduleFound = await this.dailyScheduleRepository.findOne({
        where: {
          planning: { id: dto.planningId },
          day: dto.day,
        },
        relations: ['planning'],
      });

      if (dailyScheduleFound) {
        throw new BadRequestException('Daily schedule already exists for this planning and day');
      }

      const planning = await this.planningService.findOneWithRelations(dto.planningId, ['class']);

      if (!planning) {
        throw new NotFoundException('Planning not found');
      }

      const teachers = await this.teacherService.findByIds(dto.teacherIds);

      const students = await this.studentService.findByIds(dto.studentIds);

      const dayIndex = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6,
      }[dto.day];

      const baseDate = new Date(planning.startDate);

      const date = addDays(baseDate, dayIndex);

      const dailyScheduleEntity = plainToClass(DailyScheduleEntity, {
        planning,
        teachers,
        students,
        day: dto.day,
        date: format(date, 'yyyy-MM-dd'),
        admin: adminId,
      });

      const dailySchedule = await this.dailyScheduleRepository.save(dailyScheduleEntity);

      for (const teacher of teachers) {
        this.notificationService.create({
          title: 'New Daily Schedule',
          message: `You have a new daily schedule for ${dto.day} in ${planning.class.name}`,
          userId: teacher.user.id,
        });
      }

      return dailySchedule;
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async findOne(id: number): Promise<DailyScheduleEntity | null> {
    return await this.dailyScheduleRepository.findOne({
      where: { id },
      relations: ['planning', 'teachers', 'students', 'planning.class', 'teachers.user', 'planning.campus'],
    });
  }

  async findAll(): Promise<DailyScheduleEntity[]> {
    return await this.dailyScheduleRepository.find({
      relations: ['planning', 'teachers', 'students', 'planning.class', 'teachers.user', 'planning.campus'],
    });
  }

  async update(id: number, updateData: UpdateDailyScheduleDto): Promise<DailyScheduleEntity> {
    try {
      const dailyScheduleFound = await this.dailyScheduleRepository.findOne({
        where: { id },
        relations: ['planning', 'teachers'],
      });

      if (!dailyScheduleFound) {
        throw new BadRequestException('Daily schedule not found');
      }

      if (updateData.planningId) {
        const planning = await this.planningService.findOne(updateData.planningId);

        if (!planning) {
          throw new NotFoundException('Planning not found');
        }

        dailyScheduleFound.planning = planning;
      }

      if (updateData.teacherIds) {
        const teachers = await this.teacherService.findByIds(updateData.teacherIds);

        if (!teachers || teachers.length === 0) {
          throw new NotFoundException('Teachers not found');
        }

        dailyScheduleFound.teachers = teachers;
      }

      if (updateData.studentIds) {
        const students = await this.studentService.findByIds(updateData.studentIds);

        if (!students || students.length === 0) {
          throw new NotFoundException('Students not found');
        }

        dailyScheduleFound.students = students;
      }

      if (updateData.day) {
        const dayIndex = {
          Monday: 0,
          Tuesday: 1,
          Wednesday: 2,
          Thursday: 3,
          Friday: 4,
          Saturday: 5,
          Sunday: 6,
        }[updateData.day];

        const baseDate = new Date(dailyScheduleFound.planning.startDate);

        const date = addDays(baseDate, dayIndex);

        dailyScheduleFound.date = format(date, 'yyyy-MM-dd') as any;
      }

      if (updateData.notes) {
        dailyScheduleFound.notes = updateData.notes;
      }

      const savedSchedule = await this.dailyScheduleRepository.save(dailyScheduleFound);

      for (const teacher of savedSchedule.teachers) {
        this.notificationService.create({
          title: 'Daily Schedule Updated',
          message: `Your daily schedule has been updated for ${updateData.day} in ${savedSchedule.planning.class.name}`,
          userId: teacher.user.id,
        });
      }

      return savedSchedule;
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.dailyScheduleRepository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async findFutureSchedules(classIds: number[]): Promise<DailyScheduleEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.dailyScheduleRepository.find({
      where: {
        planning: { class: { id: In(classIds) } },
        date: MoreThanOrEqual(today),
      },
      relations: ['students'],
    });
  }
}
