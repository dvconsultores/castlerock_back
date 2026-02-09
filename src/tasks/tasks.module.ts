import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { StudentEntity } from '../modules/student/entities/student.entity';
import { SubscriptionTasksService } from './subscription.task';
import { SubscriptionModule } from '../modules/subscription/subscription.module';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity]), SubscriptionModule],
  controllers: [],
  providers: [TasksService, SubscriptionTasksService],
})
export class TasksModule {}
