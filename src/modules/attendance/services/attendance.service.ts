import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from '../entities/attendance.entity';
import { CreateAttendanceDto, FindAttendanceDtoQuery } from '../dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly repository: Repository<AttendanceEntity>,
  ) {}

  async save(entity: AttendanceEntity): Promise<AttendanceEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateAttendanceDto): Promise<AttendanceEntity> {
    const newEntity = this.repository.create({
      ...dto,
      dailySchedule: { id: dto.dailyScheduleId },
      student: { id: dto.studentId },
    });

    return await this.repository.save(newEntity);
  }

  async findAll(): Promise<Partial<AttendanceEntity>[]> {
    const records = await this.repository.find({
      relations: ['dailySchedule', 'student'],
    });

    return records.map((record) => ({
      ...record,
      date: record.dailySchedule?.date,
    }));
  }

  async findOne(id: number): Promise<any | null> {
    const attendance = await this.repository.findOne({
      where: { id },
      relations: ['dailySchedule', 'student'],
    });

    return {
      ...attendance,
      date: attendance?.dailySchedule?.date,
    };
  }

  async findByParams(query: FindAttendanceDtoQuery): Promise<AttendanceEntity[]> {
    const { studentId, status } = query;

    const where: any = {};

    if (studentId) {
      where.student = { id: studentId };
    }

    if (status) {
      where.status = status;
    }

    const attendances = await this.repository.find({
      where,
      relations: ['dailySchedule', 'student'],
    });

    return attendances.map((record) => ({
      ...record,
      date: record.dailySchedule?.date,
    }));
  }

  async update(id: number, updateData: Partial<AttendanceEntity>): Promise<void> {
    const updateResult = await this.repository.update({ id }, updateData);
    if (updateResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }
}
