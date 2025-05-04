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
import { ProgramType } from '../../../shared/enums/program-type.enum';

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
}
