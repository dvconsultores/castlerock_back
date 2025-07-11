import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyScheduleEntity } from './entities/daily-schedule.entity';
import { DailyScheduleService } from './services/daily-schedule.service';
import { DailyScheduleController } from './controllers/daily-schedule.controller';
import { PlanningModule } from '../planning/planning.module';
import { TeacherModule } from '../teacher/teacher.module';
import { StudentModule } from '../student/student.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyScheduleEntity]),
    forwardRef(() => PlanningModule),
    TeacherModule,
    StudentModule,
    NotificationModule,
  ],
  exports: [DailyScheduleService],
  controllers: [DailyScheduleController],
  providers: [DailyScheduleService],
})
export class DailyScheduleModule {}
