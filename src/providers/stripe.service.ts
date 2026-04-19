import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10' as any,
      typescript: true,
    });

    this.logger.log('✅ Stripe initialized');
  }

  /* ==============================
      CUSTOMER
  ============================== */

  async createCustomer(params: { email: string; name: string; paymentMethodId: string }) {
    return this.stripe.customers.create({
      email: params.email,
      name: params.name,
      payment_method: params.paymentMethodId,
      invoice_settings: {
        default_payment_method: params.paymentMethodId,
      },
    });
  }

  /* ==============================
      SUBSCRIPTIONS
  ============================== */

  async createSubscription(params: { customerId: string; priceId: string }) {
    return this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async getSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /* ==============================
      PAYMENTS
  ============================== */

  async retryInvoice(invoiceId: string) {
    return this.stripe.invoices.pay(invoiceId);
  }

  /* ==============================
      WEBHOOK
  ============================== */

  constructWebhookEvent(payload: any, signature: string) {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not defined');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  /* ==============================
      UTILS
  ============================== */

  getClient(): Stripe {
    return this.stripe;
  }
}
