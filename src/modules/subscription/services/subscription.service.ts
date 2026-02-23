import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { CreateSubscriptionDto } from '../dto/subscription.dto';
import { SubscriptionStatus } from '../../../shared/enums/subscription-status.enum';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
  ) {}

  async save(entity: SubscriptionEntity): Promise<SubscriptionEntity> {
    return await this.repository.save(entity);
  }

  // async create(dto: CreateSubscriptionDto): Promise<SubscriptionEntity> {
  //   const newEntity = this.repository.create({ ...dto, user: { id: dto.userId } });

  //   return await this.repository.save(newEntity);
  // }

  async findOne(id: number): Promise<SubscriptionEntity | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findByFilter(filter: any): Promise<SubscriptionEntity[]> {
    return await this.repository.find(filter);
  }

  async update(id: number, updateData: Partial<SubscriptionEntity>): Promise<void> {
    const updateResult = await this.repository.update({ id }, updateData);
    if (updateResult.affected === 0) {
      throw new NotFoundException('Item no encontrado');
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item no encontrado');
    }
  }

  async findOneByCampusId(campusId: number): Promise<SubscriptionEntity | null> {
    try {
      return await this.repository.findOne({
        where: { campus: { id: campusId } },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar la suscripción por campusId');
    }
  }

  async markPaymentSucceeded({
    stripeSubId,
    stripeCustomerId,
    nextBillingDate,
  }: {
    stripeSubId?: string;
    stripeCustomerId?: string;
    nextBillingDate?: Date | null;
  }) {
    const subscription = await this.repository.findOne({
      where: stripeSubId ? { externalSubscriptionId: stripeSubId } : { campus: { stripeCustomerId } },
      relations: { campus: true, plan: true },
    });

    if (!subscription) return;

    subscription.status = SubscriptionStatus.ACTIVE;
    if (nextBillingDate) subscription.nextBillingDate = nextBillingDate;

    await this.repository.save(subscription);
  }

  async markPaymentFailed({ stripeSubId, stripeCustomerId }: { stripeSubId?: string; stripeCustomerId?: string }) {
    const subscription = await this.repository.findOne({
      where: stripeSubId ? { externalSubscriptionId: stripeSubId } : { campus: { stripeCustomerId } },
      relations: { campus: true, plan: true },
    });

    if (!subscription) return;

    // regla rápida: suspender al primer fallo
    subscription.status = SubscriptionStatus.SUSPENDED; // o PAST_DUE
    await this.repository.save(subscription);
  }

  async cancelByStripeSubId(stripeSubId: string) {
    const sub = await this.repository.findOne({
      where: { externalSubscriptionId: stripeSubId },
      relations: { campus: true, plan: true },
    });

    if (!sub) return;

    sub.status = SubscriptionStatus.CANCELED;

    // Si quieres cortar acceso ya:
    // sub.nextBillingDate = new Date();

    await this.repository.save(sub);
  }

  private mapStripeStatusToLocal(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
      case 'trialing':
        return SubscriptionStatus.ACTIVE;

      case 'past_due':
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;

      case 'canceled':
        return SubscriptionStatus.CANCELED;

      case 'incomplete':
      case 'incomplete_expired':
        return SubscriptionStatus.SUSPENDED;

      default:
        // paused o otros estados raros
        return SubscriptionStatus.SUSPENDED;
    }
  }

  async syncStripeStatus(stripeSubId: string, stripeStatus: Stripe.Subscription.Status) {
    const sub = await this.repository.findOne({
      where: { externalSubscriptionId: stripeSubId },
    });

    if (!sub) return;

    sub.status = this.mapStripeStatusToLocal(stripeStatus);
    await this.repository.save(sub);
  }
}
