import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from './entities/subscription.entity';
import { SubscriptionService } from './services/subscription.service';
import { StripeService } from '../../providers/stripe.service';
import { CampusEntity } from '../campus/entities/campus.entity';
import { PlanModule } from '../plan/plan.module';
import { SubscriptionController } from './controllers/subscription.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionEntity, CampusEntity]), PlanModule],
  exports: [SubscriptionService],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, StripeService],
})
export class SubscriptionModule {}
