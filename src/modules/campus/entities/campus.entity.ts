import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { StudentEntity } from '../../student/entities/student.entity';
import { TeacherEntity } from '../../teacher/entities/teacher.entity';
import { ClassEntity } from '../../class/entities/class.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { SubscriptionEntity } from '../../subscription/entities/subscription.entity';

@Entity({ name: 'campuses' })
export class CampusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  nickname: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column()
  image: string;

  @OneToMany(() => StudentEntity, (student) => student.campus)
  students: StudentEntity[];

  @OneToMany(() => TeacherEntity, (teacher) => teacher.campus)
  @JoinColumn()
  teachers: TeacherEntity[];

  @OneToMany(() => UserEntity, (user) => user.campus)
  @JoinColumn()
  owners: UserEntity[];

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.campus)
  subscriptions: SubscriptionEntity[];

  @Column({ nullable: true })
  stripeCustomerId: string;

  @OneToMany(() => ClassEntity, (classEntity) => classEntity.campus)
  classes: ClassEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
