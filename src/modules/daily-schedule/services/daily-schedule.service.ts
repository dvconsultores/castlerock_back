import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDailyScheduleDto, UpdateDailyScheduleDto } from '../dto/daily-schedule.dto';
import { plainToClass } from 'class-transformer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { DailyScheduleEntity } from '../entities/daily-schedule.entity';
import { addDays, format } from 'date-fns';
import { PlanningService } from '../../planning/services/planning.service';
import { TeacherService } from '../../teacher/services/teacher.service';
import { StudentService } from '../../student/services/student.service';
import { NotificationService } from '../../notification/services/notification.service';

@Injectable()
export class DailyScheduleService {
  constructor(
    @InjectRepository(DailyScheduleEntity)
    private readonly dailyScheduleRepository: Repository<DailyScheduleEntity>,
    private readonly planningService: PlanningService,
    private readonly teacherService: TeacherService,
    private readonly studentService: StudentService,
    private readonly notificationService: NotificationService,
  ) {}

  async save(entity: DailyScheduleEntity): Promise<DailyScheduleEntity> {
    return await this.dailyScheduleRepository.save(entity);
  }

  async create(dto: CreateDailyScheduleDto, adminId: number): Promise<DailyScheduleEntity> {
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

    const teacher = await this.teacherService.findOne(dto.teacherId);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const students = await this.studentService.findByIds(dto.studentIds);

    if (!students || students.length === 0) {
      throw new NotFoundException('Students not found');
    }

    await students.forEach((student) => {
      if (student.program !== planning.class.program) {
        throw new BadRequestException(`Student ${student.firstName} is not enrolled in the same program as the class`);
      }
    });

    const dayIndex = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
    }[dto.day];

    const baseDate = new Date(planning.startDate);
    const date = addDays(baseDate, dayIndex);

    const dailyScheduleEntity = plainToClass(DailyScheduleEntity, {
      planning,
      teacher,
      students,
      day: dto.day,
      date: format(date, 'yyyy-MM-dd'),
      admin: adminId,
    });

    const dailySchedule = await this.dailyScheduleRepository.save(dailyScheduleEntity);

    await this.notificationService.create({
      title: 'New Daily Schedule',
      message: `You have a new daily schedule for ${dto.day} in ${planning.class.name}`,
      userId: teacher.id,
    });

    return dailySchedule;
  }

  async findOne(id: number): Promise<DailyScheduleEntity | null> {
    return await this.dailyScheduleRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<DailyScheduleEntity[]> {
    return await this.dailyScheduleRepository.find({
      relations: ['planning', 'teacher', 'students'],
    });
  }

  async update(id: number, updateData: UpdateDailyScheduleDto): Promise<void> {
    try {
      const updateResult = await this.dailyScheduleRepository.update(
        { id },
        plainToClass(DailyScheduleEntity, updateData),
      );
      if (updateResult.affected === 0) {
        throw new NotFoundException('Item not found');
      }
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
}
