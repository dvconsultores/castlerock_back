import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationStatus } from '../../../shared/enums/notification-status.enum';

@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ nullable: true })
  title: string;

  @Column()
  message: string;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
