import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { SubscriptionEntity } from '../../subscription/entities/subscription.entity';
import { PlanStatus } from '../../../shared/enums/plan-status.enum';

@Entity({ name: 'plans' })
export class PlanEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Ej: "Plan Anual Premium"

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Ej: 1200.00

  @Column()
  currency: string; // Ej: "USD", "MXN"

  @Column()
  billingCycle: 'monthly' | 'yearly';

  //status enum StatusPlan
  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  // ID del plan en tu pasarela de pagos (ej. Stripe Price ID)
  @Column({ nullable: true })
  externalPriceId: string;

  @OneToMany(() => SubscriptionEntity, (sub) => sub.plan)
  subscriptions: SubscriptionEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
