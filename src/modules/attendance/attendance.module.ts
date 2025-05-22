import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceService } from './services/attendance.service';
import { AttendanceController } from './controllers/attendance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity])],
  exports: [AttendanceService],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
