import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { StudentService } from './services/student.service';
import { StudentController } from './controllers/student.controller';
import { ContactPersonEntity } from './entities/contact-person.entity';
import { AdditionalProgramModule } from '../additional-program/additional-program.module';
import { ClassModule } from '../class/class.module';
import { DailyScheduleModule } from '../daily-schedule/daily-schedule.module';
import { DailyScheduleEntity } from '../daily-schedule/entities/daily-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity, ContactPersonEntity, DailyScheduleEntity]),
    AdditionalProgramModule,
    ClassModule,
  ],
  exports: [StudentService],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
