import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { CampusEntity } from '../../campus/entities/campus.entity';
import { ContactPersonEntity } from './contact-person.entity';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { ProgramType } from '../../../shared/enums/program-type.enum';
import { Expose } from 'class-transformer';
import { AdditionalProgramEntity } from '../../additional-program/entities/additional-program.entity';
import { ClassEntity } from '../../class/entities/class.entity';

@Entity('students')
export class StudentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column()
  gender: 'M' | 'F' | 'Other';

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => ContactPersonEntity, (contact) => contact.student, {
    cascade: true,
  })
  contacts: ContactPersonEntity[];

  @Column({ type: 'date', name: 'end_date_of_classes', nullable: true })
  endDateOfClasses: Date;

  @Column({ type: 'date', name: 'start_date_of_classes', nullable: true })
  startDateOfClasses: Date | null;

  @Column('simple-array', { name: 'days_enrolled' })
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  daysEnrolled: WeekDayEnum[];

  @Column('simple-array', { nullable: true, name: 'before_school_days' })
  @IsOptional()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  beforeSchoolDays: WeekDayEnum[];

  @Column('simple-array', { nullable: true, name: 'after_school_days' })
  @IsOptional()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  afterSchoolDays: WeekDayEnum[];

  @ManyToMany(() => ClassEntity, (c) => c.students, { cascade: true })
  @JoinTable({
    name: 'students_classes_classes',
    joinColumn: {
      name: 'studentsId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'classesId',
      referencedColumnName: 'id',
    },
  })
  classes: ClassEntity[];

  @Column({ type: 'date', name: 'start_date_of_classes_transition', nullable: true })
  startDateOfClassesTransition: Date | null;

  @Column('simple-array', { name: 'days_enrolled_transition', nullable: true })
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  daysEnrolledTransition: WeekDayEnum[];

  @Column('simple-array', { nullable: true, name: 'before_school_days_transition' })
  @IsOptional()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  beforeSchoolDaysTransition: WeekDayEnum[];

  @Column('simple-array', { nullable: true, name: 'after_school_days_transition' })
  @IsOptional()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  afterSchoolDaysTransition: WeekDayEnum[];

  @ManyToMany(() => ClassEntity, (c) => c.studentsTransition, { cascade: true })
  @JoinTable({
    name: 'students_classes_transition_classes',
    joinColumn: {
      name: 'studentsId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'classesId',
      referencedColumnName: 'id',
    },
  })
  classesTransition: ClassEntity[];

  @ManyToMany(() => AdditionalProgramEntity)
  @JoinTable()
  additionalPrograms: AdditionalProgramEntity[];

  @ManyToOne(() => CampusEntity, (campus) => campus.students, { nullable: true, onDelete: 'SET NULL' })
  campus: CampusEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column('decimal', {
    name: 'weekly_amount',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  weeklyAmount: number;

  @Column('decimal', {
    name: 'monthly_amount',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  monthlyAmount: number;

  // @Expose()
  // get program(): ProgramType {
  //   if (!this.dateOfBirth) return ProgramType.PRIMARY;

  //   const ageInMonths = this.getAgeInMonths();
  //   return ageInMonths > 24 ? ProgramType.TODDLER : ProgramType.PRIMARY;
  // }

  // private getAgeInMonths(): number {
  //   const now = new Date();
  //   const birth = new Date(this.dateOfBirth);
  //   const years = now.getFullYear() - birth.getFullYear();
  //   const months = now.getMonth() - birth.getMonth();
  //   return years * 12 + months;
  // }
}
