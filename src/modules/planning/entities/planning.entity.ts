import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { CampusEntity } from '../../campus/entities/campus.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { ClassEntity } from '../../class/entities/class.entity';
import { DailyScheduleEntity } from '../../daily-schedule/entities/daily-schedule.entity';

@Entity({ name: 'planning' })
export class PlanningEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column()
  week: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @ManyToOne(() => UserEntity)
  admin: UserEntity;

  @ManyToOne(() => CampusEntity)
  campus: CampusEntity;

  @ManyToOne(() => ClassEntity, {
    onDelete: 'SET NULL',
  })
  class: ClassEntity;

  @OneToMany(() => DailyScheduleEntity, (dailySchedule) => dailySchedule.planning, {
    cascade: true,
  })
  dailySchedules: DailyScheduleEntity[];
}
