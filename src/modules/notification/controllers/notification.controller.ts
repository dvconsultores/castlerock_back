import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, Put } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateNotificationDto, UpdateNotificationDto } from '../dto/notification.dto';
import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(@Body() body: CreateNotificationDto) {
    return this.notificationService.create(body);
  }

  @Get()
  async findAll() {
    return this.notificationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.notificationService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() body: UpdateNotificationDto) {
    return this.notificationService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.notificationService.remove(id);
  }
}
