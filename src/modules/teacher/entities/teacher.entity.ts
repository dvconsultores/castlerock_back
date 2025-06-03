import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { CampusEntity } from '../../campus/entities/campus.entity';
import { ClassEntity } from '../../class/entities/class.entity';

@Entity({ name: 'teachers' })
export class TeacherEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;

  @ManyToOne(() => CampusEntity, (campus) => campus.teachers, { onDelete: 'SET NULL' })
  campus: CampusEntity;

  @ManyToMany(() => ClassEntity, (classEntity) => classEntity.teachers, {
    cascade: true,
  })
  @JoinTable()
  classes: ClassEntity[];
}
