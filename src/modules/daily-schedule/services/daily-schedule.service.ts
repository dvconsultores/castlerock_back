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
        where: { planning: { id: dto.planningId }, day: dto.day },
        relations: ['planning'],
      });
      if (dailyScheduleFound) {
        throw new BadRequestException('Daily schedule already exists for this planning and day');
      }

      const planning = await this.planningService.findOneWithRelations(dto.planningId, ['class']);

      if (!planning) throw new NotFoundException('Planning not found');

      const teachers = await this.teacherService.findByIds(dto.teacherIds);

      const dayIndex = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }[dto.day];
      const baseDate = new Date(planning.startDate);
      console.log(baseDate, dayIndex);
      const scheduleDate = addDays(baseDate, dayIndex);

      scheduleDate.setHours(0, 0, 0, 0);

      const allStudents = await this.studentService.findByIds(dto.studentIds);

      const students = allStudents.filter((s) => {
        const hasStart = !!s.startDateOfClasses;
        const hasEnd = !!s.endDateOfClasses;
        const hasStartTransition = !!s.startDateOfClassesTransition;

        if (!hasStart && !hasEnd && !hasStartTransition) return true;

        const sd = hasStart ? this.normalizeDate(s.startDateOfClasses) : null;
        const ed = hasEnd ? this.normalizeDate(s.endDateOfClasses) : null;
        const sdTransition = hasStartTransition ? this.normalizeDate(s.startDateOfClassesTransition) : null;

        const schNorm = this.normalizeDate(scheduleDate);

        const afterStart = !sd || schNorm!.getTime() >= sd.getTime();
        const beforeEnd = !ed || schNorm!.getTime() <= ed.getTime();
        const beforeStartTransition = !sdTransition || schNorm!.getTime() < sdTransition.getTime();

        return afterStart && beforeEnd && beforeStartTransition;
      });

      if (dto.transitionStudentIds && dto.transitionStudentIds.length > 0) {
        const transitionStudents = await this.studentService.findByIds(dto.transitionStudentIds);

        for (const ts of transitionStudents) {
          const hasEnd = !!ts.endDateOfClasses;
          const hasStartTransition = !!ts.startDateOfClassesTransition;

          if (!hasEnd && !hasStartTransition) {
            students.push(ts);
            continue;
          }

          const ed = hasEnd ? new Date(ts.endDateOfClasses as any) : null;
          const sdTransition = hasStartTransition ? new Date(ts.startDateOfClassesTransition as any) : null;

          if (ed) ed.setHours(0, 0, 0, 0);
          if (sdTransition) sdTransition.setHours(0, 0, 0, 0);

          const beforeEnd = !ed || scheduleDate.getTime() <= ed.getTime();
          const beforeStartTransition = !sdTransition || scheduleDate.getTime() >= sdTransition.getTime();

          if (beforeEnd && beforeStartTransition) {
            students.push(ts);
          }
        }
      }

      const dailyScheduleEntity = plainToClass(DailyScheduleEntity, {
        planning,
        teachers,
        students,
        day: dto.day,
        date: scheduleDate,
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

  normalizeDate(date: Date | string | null): Date | null {
    if (!date) return null;

    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  async findOne(id: number): Promise<DailyScheduleEntity | null> {
    return await this.dailyScheduleRepository.findOne({
      where: { id },
      relations: ['planning', 'teachers', 'students', 'planning.class', 'teachers.user', 'planning.campus'],
    });
  }

  async findAll(): Promise<DailyScheduleEntity[]> {
    // 🥇 Paso 1 — obtener schedules con relaciones ligeras
    const schedules = await this.dailyScheduleRepository
      .createQueryBuilder('daily')
      .leftJoinAndSelect('daily.planning', 'planning')
      .leftJoinAndSelect('planning.class', 'class')
      .leftJoin('planning.campus', 'campus')
      .addSelect(['campus.id', 'campus.name'])
      .getMany();

    if (!schedules.length) return [];

    const scheduleIds = schedules.map((s) => s.id);

    // 🥈 Paso 2 — cargar teachers aparte (SOLO CAMPOS NECESARIOS)
    const teacherRelations = await this.dailyScheduleRepository
      .createQueryBuilder('daily')
      .leftJoin('daily.teachers', 'teacher')
      .leftJoin('teacher.user', 'user')
      .addSelect(['teacher.id', 'user.id', 'user.firstName', 'user.lastName', 'user.email'])
      .where('daily.id IN (:...ids)', { ids: scheduleIds })
      .getMany();

    // 🥉 Paso 3 — cargar students aparte (SOLO CAMPOS NECESARIOS)
    const studentRelations = await this.dailyScheduleRepository
      .createQueryBuilder('daily')
      .leftJoin('daily.students', 'student')
      .addSelect(['student.id', 'student.firstName', 'student.lastName', 'student.daysEnrolled'])
      .where('daily.id IN (:...ids)', { ids: scheduleIds })
      .getMany();

    // 🧩 Paso 4 — unir en memoria
    const teacherMap = new Map<number, any[]>();
    teacherRelations.forEach((d) => {
      teacherMap.set(d.id, d.teachers || []);
    });

    const studentMap = new Map<number, any[]>();
    studentRelations.forEach((d) => {
      studentMap.set(d.id, d.students || []);
    });

    schedules.forEach((schedule) => {
      schedule.teachers = teacherMap.get(schedule.id) || [];
      schedule.students = studentMap.get(schedule.id) || [];
    });

    return schedules;
  }

  async update(id: number, updateData: UpdateDailyScheduleDto): Promise<DailyScheduleEntity> {
    try {
      const dailyScheduleFound = await this.dailyScheduleRepository.findOne({
        where: { id },
        relations: ['planning', 'teachers', 'students', 'planning.class'],
      });
      if (!dailyScheduleFound) throw new BadRequestException('Daily schedule not found');

      if (updateData.planningId) {
        const planning = await this.planningService.findOne(updateData.planningId);
        if (!planning) throw new NotFoundException('Planning not found');
        dailyScheduleFound.planning = planning;
      }

      if (updateData.teacherIds) {
        const teachers = await this.teacherService.findByIds(updateData.teacherIds);
        if (!teachers || teachers.length === 0) throw new NotFoundException('Teachers not found');
        dailyScheduleFound.teachers = teachers;
      }

      const dayToUse = updateData.day ?? dailyScheduleFound.day;
      const dayIndexMap: Record<string, number> = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6,
      };
      const dayIndex = dayIndexMap[dayToUse];

      const baseDate = new Date(dailyScheduleFound.planning.startDate);
      const scheduleDate = addDays(baseDate, dayIndex);
      scheduleDate.setHours(0, 0, 0, 0);

      if (updateData.studentIds) {
        const allStudents = await this.studentService.findByIds(updateData.studentIds);
        if (!allStudents || allStudents.length === 0) throw new NotFoundException('Students not found');

        const students = allStudents.filter((s) => {
          const hasStart = !!s.startDateOfClasses;
          const hasEnd = !!s.endDateOfClasses;
          const hasStartTransition = !!s.startDateOfClassesTransition;

          if (!hasStart && !hasEnd && !hasStartTransition) return true;

          const sd = hasStart ? new Date(s.startDateOfClasses as any) : null;
          const ed = hasEnd ? new Date(s.endDateOfClasses as any) : null;
          const sdTransition = hasStartTransition ? new Date(s.startDateOfClassesTransition as any) : null;

          if (sd) sd.setHours(0, 0, 0, 0);
          if (ed) ed.setHours(0, 0, 0, 0);
          if (sdTransition) sdTransition.setHours(0, 0, 0, 0);

          const afterStart = !sd || scheduleDate.getTime() >= sd.getTime();
          const beforeEnd = !ed || scheduleDate.getTime() <= ed.getTime();
          const beforeStartTransition = !sdTransition || scheduleDate.getTime() <= sdTransition.getTime();

          return afterStart && beforeEnd && beforeStartTransition;
        });

        dailyScheduleFound.students = students;
      } else if (updateData.day || updateData.planningId) {
        dailyScheduleFound.students = (dailyScheduleFound.students ?? []).filter((s) => {
          const hasStart = !!s.startDateOfClasses;
          const hasEnd = !!s.endDateOfClasses;
          const hasStartTransition = !!s.startDateOfClassesTransition;

          if (!hasStart && !hasEnd && !hasStartTransition) return true;

          const sd = hasStart ? new Date(s.startDateOfClasses as any) : null;
          const ed = hasEnd ? new Date(s.endDateOfClasses as any) : null;
          const sdTransition = hasStartTransition ? new Date(s.startDateOfClassesTransition as any) : null;

          if (sd) sd.setHours(0, 0, 0, 0);
          if (ed) ed.setHours(0, 0, 0, 0);
          if (sdTransition) sdTransition.setHours(0, 0, 0, 0);

          const afterStart = !sd || scheduleDate.getTime() >= sd.getTime();
          const beforeEnd = !ed || scheduleDate.getTime() <= ed.getTime();
          const beforeStartTransition = !sdTransition || scheduleDate.getTime() <= sdTransition.getTime();

          return afterStart && beforeEnd && beforeStartTransition;
        });
      }

      if (updateData.day) {
        dailyScheduleFound.day = updateData.day;
        dailyScheduleFound.date = format(scheduleDate, 'yyyy-MM-dd') as any;
      }

      if (updateData.notes) {
        dailyScheduleFound.notes = updateData.notes;
      }

      const savedSchedule = await this.dailyScheduleRepository.save(dailyScheduleFound);

      for (const teacher of savedSchedule.teachers) {
        this.notificationService.create({
          title: 'Daily Schedule Updated',
          message: `Your daily schedule has been updated for ${dayToUse} in ${savedSchedule.planning.class.name}`,
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
