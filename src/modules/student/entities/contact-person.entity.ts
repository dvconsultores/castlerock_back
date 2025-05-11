import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { RelationshipType } from '../../../shared/enums/relationship-type.enum';
import { StudentEntity } from './student.entity';

@Entity('contact_people')
export class ContactPersonEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  phone: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
  })
  relation: RelationshipType;

  @Column()
  role: 'PRIMARY' | 'SECONDARY' | 'EMERGENCY_1' | 'EMERGENCY_2';

  @ManyToOne(() => StudentEntity, (student) => student.contacts, {
    onDelete: 'CASCADE',
  })
  student: StudentEntity;

  @Column({ nullable: true })
  image: string;
}
