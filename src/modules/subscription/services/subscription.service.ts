import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { CreateSubscriptionDto } from '../dto/subscription.dto';
import { SubscriptionStatus } from '../../../shared/enums/subscription-status.enum';
import Stripe from 'stripe';
import { StripeService } from '../../../providers/stripe.service';
import { CampusEntity } from '../../campus/entities/campus.entity';
import { PlanService } from '../../plan/services/plan.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
    private readonly stripeService: StripeService,
    @InjectRepository(CampusEntity)
    private readonly campusRepository: Repository<CampusEntity>,
    private readonly planService: PlanService,
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
        where: { campus: { id: campusId }, status: SubscriptionStatus.ACTIVE },
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

  async reactivateSubscription(campusId: number, planId: number, paymentMethodId: string) {
    const stripe = this.stripeService.getClient();

    // 1) Cargar suscripción actual + campus + plan
    const currentSub = await this.repository.findOne({
      where: { campus: { id: campusId } },
      relations: { campus: true, plan: true },
      order: { id: 'DESC' as any },
    });

    if (!currentSub) throw new NotFoundException('Subscription not found');
    if (!currentSub.campus) throw new BadRequestException('Campus not found in subscription');

    // 2) Plan elegido (mensual/anual)
    const newPlan = await this.planService.findOne(planId);
    if (!newPlan) throw new NotFoundException('Plan not found');
    if (!newPlan.externalPriceId) throw new BadRequestException('Plan is not linked with Stripe');

    // 3) Asegurar Stripe customer (para trials viejos sin customer)
    let stripeCustomerId = currentSub.campus.stripeCustomerId;

    if (!stripeCustomerId) {
      const createdCustomer = await stripe.customers.create({
        name: currentSub.campus.name,
        // si en campus no guardas email, usa el del owner si lo tienes;
        // aquí lo dejamos sin email para no fallar
      });

      stripeCustomerId = createdCustomer.id;

      currentSub.campus.stripeCustomerId = stripeCustomerId;
      await this.campusRepository.save(currentSub.campus);
    }

    // 4) Attach payment method al customer
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
    } catch (e: any) {
      const code = e?.code as string | undefined;

      // Si ya estaba adjunto a ESTE customer, no es problema.
      // Si estaba adjunto a otro customer, Stripe suele dar error de "already_attached" o similar.
      // Como no hay una sola constante estable, lo manejamos por message/code.
      const msg = (e?.message || '').toLowerCase();
      const already =
        code === 'payment_method_unexpected_state' ||
        msg.includes('already') ||
        msg.includes('attached') ||
        msg.includes('customer');

      if (!already) {
        throw new BadRequestException(`Failed to attach payment method: ${e.message}`);
      }
    }

    // 5) Set default payment method en customer
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 6) Caso A: venía de trial / no tenía Stripe subscription -> crear nueva
    if (!currentSub.externalSubscriptionId) {
      const stripeSub: any = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: newPlan.externalPriceId }],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
      });

      // Si quedó incompleta, el PaymentIntent puede venir en latest_invoice.payment_intent
      // pero para tu flujo backend-only, si no está active, lo tratamos como error.
      if (stripeSub.status !== 'active' && stripeSub.status !== 'trialing') {
        throw new BadRequestException(`Stripe subscription not active: ${stripeSub.status}`);
      }

      // Actualizar la misma fila (MVP)
      currentSub.plan = newPlan;
      currentSub.externalSubscriptionId = stripeSub.id;
      currentSub.status = SubscriptionStatus.ACTIVE;
      currentSub.startDate = new Date();
      currentSub.nextBillingDate = new Date(stripeSub.current_period_end * 1000);

      await this.repository.save(currentSub);

      return {
        ok: true,
        mode: 'trial_to_paid',
        stripeCustomerId,
        stripeSubscriptionId: stripeSub.id,
        status: currentSub.status,
        nextBillingDate: currentSub.nextBillingDate,
      };
    }

    // 7) Caso B: ya existe Stripe subscription (estaba past_due/suspended)
    const stripeSubId = currentSub.externalSubscriptionId;

    // A) actualizar default PM en la subscription también
    await stripe.subscriptions.update(stripeSubId, {
      default_payment_method: paymentMethodId,
      // Si quieres permitir cambio de plan al reactivar:
      // items: [{ price: newPlan.externalPriceId }],  // OJO: esto requiere saber el subscription_item_id existente para update correcto.
    });

    // B) pagar invoice open si existe
    const openInvoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      subscription: stripeSubId,
      status: 'open',
      limit: 1,
    });

    if (openInvoices.data.length > 0) {
      const inv = openInvoices.data[0];
      const paid = await stripe.invoices.pay(inv.id);

      if (paid.status !== 'paid') {
        // No pudo pagarse
        currentSub.status = SubscriptionStatus.PAST_DUE; // o SUSPENDED si tú quieres
        await this.repository.save(currentSub);
        throw new BadRequestException('Payment could not be completed');
      }

      // Pagó OK => activar y actualizar nextBillingDate
      currentSub.status = SubscriptionStatus.ACTIVE;

      const line = paid.lines?.data?.[0];
      const nextBillingDate = line?.period?.end ? new Date(line.period.end * 1000) : null;

      if (nextBillingDate) currentSub.nextBillingDate = nextBillingDate;

      // Si quieres permitir cambiar de plan al reactivar (solo DB):
      currentSub.plan = newPlan;

      await this.repository.save(currentSub);

      return {
        ok: true,
        mode: 'paid_open_invoice',
        invoiceId: paid.id,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubId,
        status: currentSub.status,
        nextBillingDate: currentSub.nextBillingDate,
      };
    }

    // C) si no hay invoice open, refrescar datos desde subscription
    const stripeSub: any = await stripe.subscriptions.retrieve(stripeSubId);

    // Map simple: si en Stripe está activa, activamos
    if (stripeSub.status === 'active' || stripeSub.status === 'trialing') {
      currentSub.status = SubscriptionStatus.ACTIVE;
    } else if (stripeSub.status === 'past_due' || stripeSub.status === 'unpaid') {
      currentSub.status = SubscriptionStatus.PAST_DUE;
    } else if (stripeSub.status === 'canceled') {
      currentSub.status = SubscriptionStatus.CANCELED;
    } else {
      currentSub.status = SubscriptionStatus.SUSPENDED;
    }

    currentSub.plan = newPlan; // solo si permites cambiar de plan aquí
    currentSub.nextBillingDate = new Date(stripeSub.current_period_end * 1000);

    await this.repository.save(currentSub);

    return {
      ok: true,
      mode: 'sync_only',
      stripeCustomerId,
      stripeSubscriptionId: stripeSubId,
      status: currentSub.status,
      nextBillingDate: currentSub.nextBillingDate,
    };
  }
}
