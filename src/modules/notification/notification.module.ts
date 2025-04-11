import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  exports: [NotificationService],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
