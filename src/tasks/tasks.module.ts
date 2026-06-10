import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { StudentEntity } from '../modules/student/entities/student.entity';
import { StudentTransitionEntity } from '../modules/student/entities/student-transition.entity';
import { DailyScheduleEntity } from '../modules/daily-schedule/entities/daily-schedule.entity';
import { SubscriptionTasksService } from './subscription.task';
import { SubscriptionModule } from '../modules/subscription/subscription.module';
import { StudentModule } from '../modules/student/student.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity, StudentTransitionEntity, DailyScheduleEntity]),
    SubscriptionModule,
    StudentModule,
  ],
  controllers: [],
  providers: [TasksService, SubscriptionTasksService],
})
export class TasksModule {}
