import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherEntity } from './entities/teacher.entity';
import { TeacherService } from './services/teacher.service';
import { TeacherController } from './controllers/teacher.controller';
import { UserModule } from '../user/user.module';
import { ClassModule } from '../class/class.module';
import { DailyScheduleModule } from '../daily-schedule/daily-schedule.module';
import { DailyScheduleEntity } from '../daily-schedule/entities/daily-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherEntity, DailyScheduleEntity]), UserModule, ClassModule],
  exports: [TypeOrmModule, TeacherService],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
