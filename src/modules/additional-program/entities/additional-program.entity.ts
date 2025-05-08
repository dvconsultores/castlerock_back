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
import { IsArray, IsEnum } from 'class-validator';
import { DayOfWeekEnum } from '../../../shared/enums/days-of-week.enum';

@Entity({ name: 'additional_programs' })
export class AdditionalProgramEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => CampusEntity)
  campus: CampusEntity;

  @Column('simple-array', { name: 'days' })
  @IsArray()
  @IsEnum(DayOfWeekEnum, { each: true })
  days: DayOfWeekEnum[];

  @Column()
  image: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
