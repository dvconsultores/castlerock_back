import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { TransitionStatus } from '../../../shared/enums/transition-status.enum';
import { StudentEntity } from './student.entity';
import { ClassEntity } from '../../class/entities/class.entity';

@Entity('student_transitions')
@Index(['student'])
@Index(['status'])
@Index(['startDate'])
export class StudentTransitionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => StudentEntity, (student) => student.transitions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  student: StudentEntity;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column('simple-array', { name: 'days_enrolled', nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  daysEnrolled: WeekDayEnum[];

  @Column('simple-array', { name: 'before_school_days', nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  beforeSchoolDays: WeekDayEnum[];

  @Column('simple-array', { name: 'after_school_days', nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  afterSchoolDays: WeekDayEnum[];

  @ManyToMany(() => ClassEntity, { cascade: true })
  @JoinTable({
    name: 'student_transitions_classes',
    joinColumn: {
      name: 'transitionId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'classId',
      referencedColumnName: 'id',
    },
  })
  classes: ClassEntity[];

  @Column({
    type: 'enum',
    enum: TransitionStatus,
    default: TransitionStatus.PENDING,
  })
  status: TransitionStatus;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
