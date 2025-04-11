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
}
