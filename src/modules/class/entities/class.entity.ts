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
import { ProgramType } from '../../../shared/enums/program-type.enum';
import { StudentEntity } from '../../student/entities/student.entity';
import { TeacherEntity } from '../../teacher/entities/teacher.entity';
import { ClassType } from '../../../shared/enums/class-type.enum';

@Entity({ name: 'classes' })
export class ClassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'max_capacity' })
  maxCapacity: number;

  @ManyToOne(() => CampusEntity, (campus) => campus.classes)
  campus: CampusEntity;

  @Column({
    type: 'enum',
    enum: ProgramType,
  })
  program: ProgramType;

  @Column({ nullable: true })
  image: string;

  @ManyToMany(() => TeacherEntity, (teacher) => teacher.classes)
  teachers: TeacherEntity[];

  @ManyToMany(() => StudentEntity, (student) => student.classes)
  students: StudentEntity[];

  @Column({
    name: 'class_type',
    default: ClassType.ENROLLED,
    type: 'enum',
    enum: ClassType,
  })
  classType: ClassType;
}
