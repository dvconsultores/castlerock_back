import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { PlanningEntity } from '../../planning/entities/planning.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { StudentEntity } from '../../student/entities/student.entity';
import { TeacherEntity } from '../../teacher/entities/teacher.entity';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';

@Entity({ name: 'daily_schedules' })
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

  @ManyToOne(() => TeacherEntity, { nullable: false })
  teacher: TeacherEntity;

  @ManyToMany(() => StudentEntity)
  @JoinTable()
  students: StudentEntity[];

  @ManyToOne(() => UserEntity, { nullable: false })
  admin: UserEntity;
}
