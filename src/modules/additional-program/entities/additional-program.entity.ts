import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { CampusEntity } from '../../campus/entities/campus.entity';
import { IsArray, IsEnum } from 'class-validator';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { StudentEntity } from '../../student/entities/student.entity';

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
  @IsEnum(WeekDayEnum, { each: true })
  days: WeekDayEnum[];

  @Column({ nullable: true })
  image: string;

  @ManyToMany(() => StudentEntity, (student) => student.additionalPrograms)
  students: StudentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
