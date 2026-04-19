import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './controllers/webhook.controller';
import { StripeService } from '../../providers/stripe.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  exports: [StripeService],
  controllers: [WebhookController],
  providers: [StripeService],
})
export class WebhookModule {}
