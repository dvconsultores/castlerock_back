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
import { UserEntity } from '../../user/entities/user.entity';
import { CampusEntity } from '../../campus/entities/campus.entity';

@Entity({ name: 'teachers' })
export class TeacherEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;

  @ManyToOne(() => CampusEntity, (campus) => campus.teachers, { onDelete: 'SET NULL' })
  campus: CampusEntity;
}
