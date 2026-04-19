import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SubscriptionEntity } from '../modules/subscription/entities/subscription.entity';
import { SubscriptionStatus } from '../shared/enums/subscription-status.enum';
import { BillingCycle } from '../modules/plan/entities/plan.entity';
import { SubscriptionService } from '../modules/subscription/services/subscription.service';

@Injectable()
export class SubscriptionTasksService {
  private readonly logger = new Logger(SubscriptionTasksService.name);

  constructor(private readonly subscriptionRepository: SubscriptionService) {}

  @Cron('0 0 * * * *') // Cada hora
  async checkExpiredSubscriptions() {
    this.logger.log('⏰ Revisando suscripciones vencidas (con gracia)...');

    try {
      const graceLimit = new Date();
      graceLimit.setDate(graceLimit.getDate() - 1);

      const expiredSubscriptions = await this.subscriptionRepository.findByFilter({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: LessThan(graceLimit), // 👈 CLAVE
        },
        relations: ['plan', 'campus'],
      });

      if (!expiredSubscriptions.length) {
        this.logger.log('No hay suscripciones vencidas.');
        return;
      }

      this.logger.log(`Encontradas ${expiredSubscriptions.length} suscripciones fuera de gracia.`);

      for (const subscription of expiredSubscriptions) {
        /* 🟡 Trial */
        if (subscription.plan.billingCycle === BillingCycle.TRIAL) {
          subscription.status = SubscriptionStatus.PAST_DUE;

          this.logger.warn(`⏳ Trial vencido (gracia agotada) - Campus ${subscription.campus.id}`);
        } else {
          /* 🔴 Pago */
          subscription.status = SubscriptionStatus.SUSPENDED;

          this.logger.error(`🚫 Suscripción suspendida (impago) - Campus ${subscription.campus.id}`);
        }

        await this.subscriptionRepository.save(subscription);
      }

      this.logger.log('✅ Revisión completada.');
    } catch (error: any) {
      this.logger.error('❌ Error revisando suscripciones', error.stack);
    }
  }
}
