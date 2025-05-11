import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyScheduleEntity } from './entities/daily-schedule.entity';
import { DailyScheduleService } from './services/daily-schedule.service';
import { DailyScheduleController } from './controllers/daily-schedule.controller';
import { PlanningModule } from '../planning/planning.module';
import { TeacherModule } from '../teacher/teacher.module';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyScheduleEntity]), PlanningModule, TeacherModule, StudentModule],
  exports: [DailyScheduleService],
  controllers: [DailyScheduleController],
  providers: [DailyScheduleService],
})
export class DailyScheduleModule {}
