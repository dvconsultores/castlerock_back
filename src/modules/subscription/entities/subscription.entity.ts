import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CampusEntity } from '../../campus/entities/campus.entity';
import { SubscriptionStatus } from '../../../shared/enums/subscription-status.enum';
import { PlanEntity } from '../../plan/entities/plan.entity';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  nextBillingDate: Date; // CRUCIAL: Aquí sabes cuándo cortar el servicio

  // Relación con el Campus (Una escuela tiene una suscripción activa)
  @ManyToOne(() => CampusEntity, (campus) => campus.subscriptions)
  @JoinColumn({ name: 'campus_id' })
  campus: CampusEntity;

  // Relación con el Plan
  @ManyToOne(() => PlanEntity, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: PlanEntity;

  // ID de la suscripción en Stripe/MercadoPago
  @Column({ nullable: true })
  externalSubscriptionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
