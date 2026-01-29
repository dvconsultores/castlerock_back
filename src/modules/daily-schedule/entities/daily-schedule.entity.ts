import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, Index } from 'typeorm';
import { PlanningEntity } from '../../planning/entities/planning.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { StudentEntity } from '../../student/entities/student.entity';
import { TeacherEntity } from '../../teacher/entities/teacher.entity';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';

@Entity({ name: 'daily_schedules' })
@Index(['date'])
@Index(['day'])
@Index(['planning'])
@Index(['planning', 'date'])
export class DailyScheduleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: WeekDayEnum })
  day: WeekDayEnum;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => PlanningEntity, (planning) => planning.dailySchedules, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  planning: PlanningEntity;

  @ManyToMany(() => TeacherEntity)
  @JoinTable()
  teachers: TeacherEntity[];

  @ManyToMany(() => StudentEntity)
  @JoinTable()
  students: StudentEntity[];

  @Index()
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'SET NULL' })
  admin: UserEntity;

  @Column({ nullable: true })
  notes: string;
}
