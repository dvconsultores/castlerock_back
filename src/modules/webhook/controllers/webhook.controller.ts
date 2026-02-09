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

@ApiTags('Webhook')
@Controller()
export class WebhookController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('stripe/webhook')
  handleWebhook(@Req() req: Request) {
    const signature = req.headers['stripe-signature'] as string;

    const event = this.stripeService.constructWebhookEvent(
      req.body, // 👈 Buffer
      signature,
    );

    console.log('Received Stripe webhook:', event.type);

    switch (event.type) {
      case 'invoice.payment_succeeded':
        // activar cuenta
        break;
    }

    return { received: true };
  }
}
