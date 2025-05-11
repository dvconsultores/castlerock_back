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
import { CreateNotificationDto, UpdateNotificationDto } from '../dto/notification.dto';
import { NotificationService } from '../services/notification.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { User } from '../../../helpers/decorators/user.decorator';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // @Post()
  // async create(@Body() body: CreateNotificationDto) {
  //   return this.notificationService.create(body);
  // }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findByUserId(@User() user: AuthUser) {
    return this.notificationService.findByUserId(user.id);
  }

  // @Get(':notificationId')
  // async findOne(@Param('notificationId') id: number) {
  //   return this.notificationService.findOne(id);
  // }

  @Patch(':notificationId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async update(@Param('notificationId') id: number, @Body() body: UpdateNotificationDto) {
    return this.notificationService.update(id, body);
  }

  @Delete(':notificationId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async remove(@Param('notificationId') id: number) {
    return this.notificationService.remove(id);
  }
}
