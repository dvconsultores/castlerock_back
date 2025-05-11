import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { DailyScheduleEntity } from '../../daily-schedule/entities/daily-schedule.entity';
import { StudentEntity } from '../../student/entities/student.entity';
import { AttendanceStatus } from '../../../shared/enums/attendance-status.enum';

@Entity({ name: 'attendances' })
export class AttendanceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DailyScheduleEntity, { nullable: false, onDelete: 'CASCADE' })
  dailySchedule: DailyScheduleEntity;

  @ManyToOne(() => StudentEntity, { nullable: false, onDelete: 'CASCADE' })
  student: StudentEntity;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  observations?: string;
}
