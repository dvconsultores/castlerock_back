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
import { CreateReportDto } from '../dto/report.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ClassService } from '../../class/services/class.service';
import { DailyScheduleEntity } from '../../daily-schedule/entities/daily-schedule.entity';
import { StudentService } from '../../student/services/student.service';
import { StudentEntity } from '../../student/entities/student.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
  ) {}

  async create(dto: CreateReportDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const students = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.classes', 'class')
      .where('class.id = :classId', { classId: dto.classId })
      .andWhere(
        `
      (student.startDateOfClasses IS NULL OR student.startDateOfClasses <= :endDate)
      AND
      (student.endDateOfClasses IS NULL OR student.endDateOfClasses >= :startDate)
      `,
        { startDate, endDate },
      )
      .getMany();

    return this.calculateTotals(students, startDate, endDate);
  }

  private calculateTotals(students: StudentEntity[], startDate: Date, endDate: Date) {
    let totalWeekly = 0;
    let totalMonthly = 0;

    const details = students.map((student) => {
      const activeDays = this.getActiveDaysInRange(student, startDate, endDate);

      const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const weekly = totalDays > 0 ? (activeDays / totalDays) * Number(student.weeklyAmount || 0) : 0;

      const monthly = totalDays > 0 ? (activeDays / totalDays) * Number(student.monthlyAmount || 0) : 0;

      totalWeekly += weekly;
      totalMonthly += monthly;

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        activeDays,
        weeklyAmount: Number(student.weeklyAmount || 0),
        monthlyAmount: Number(student.monthlyAmount || 0),
        calculatedWeekly: Number(weekly.toFixed(2)),
        calculatedMonthly: Number(monthly.toFixed(2)),
      };
    });

    return {
      range: {
        startDate,
        endDate,
      },
      studentsCount: students.length,
      totalWeekly: Number(totalWeekly.toFixed(2)),
      totalMonthly: Number(totalMonthly.toFixed(2)),
      details,
    };
  }

  private getActiveDaysInRange(student: StudentEntity, rangeStart: Date, rangeEnd: Date): number {
    const start =
      student.startDateOfClasses && student.startDateOfClasses > rangeStart ? student.startDateOfClasses : rangeStart;

    const end = student.endDateOfClasses && student.endDateOfClasses < rangeEnd ? student.endDateOfClasses : rangeEnd;

    if (end < start) return 0;

    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}
