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
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { User } from '../../../helpers/decorators/user.decorator';
import { SubscriptionService } from '../services/subscription.service';
import { ReactivateSubscriptionDto } from '../dto/subscription.dto';

@ApiTags('Subscription')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('reactivate')
  async reactivate(@User() user: AuthUser, @Body() dto: ReactivateSubscriptionDto) {
    return this.subscriptionService.reactivateSubscription(user.campusId, dto.planId, dto.paymentMethodId);
  }

  @Post('cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async cancel(@User() user: AuthUser) {
    return this.subscriptionService.cancelSubscription(user.campusId);
  }
}
