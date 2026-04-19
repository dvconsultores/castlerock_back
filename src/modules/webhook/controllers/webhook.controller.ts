import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { User } from '../../../helpers/decorators/user.decorator';
import { StripeService } from '../../../providers/stripe.service';
import { SubscriptionService } from '../../subscription/services/subscription.service';
import Stripe from 'stripe';
import { Response } from 'express';

@ApiTags('Webhook')
@Controller()
export class WebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('stripe/webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    console.log(`Received Stripe event:`, event);

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice: any = event.data.object as Stripe.Invoice;

        // id de suscripción en Stripe
        const stripeSubId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;

        // customer en Stripe
        const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

        // próxima fecha real desde Stripe (period_end viene en invoice.lines.data[0].period.end)
        const line = invoice.lines?.data?.[0];
        const nextBillingDate = line?.period?.end ? new Date(line.period.end * 1000) : null;

        await this.subscriptionService.markPaymentSucceeded({
          stripeSubId,
          stripeCustomerId,
          nextBillingDate,
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice: any = event.data.object as Stripe.Invoice;

        const stripeSubId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;

        const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

        await this.subscriptionService.markPaymentFailed({
          stripeSubId,
          stripeCustomerId,
        });

        break;
      }

      // opcionales pero útiles
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.subscriptionService.cancelByStripeSubId(sub.id);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        // útil para capturar cambios de estado: past_due, unpaid, canceled, etc.
        await this.subscriptionService.syncStripeStatus(sub.id, sub.status);
        break;
      }
    }

    return res.json({ received: true });
  }
}
