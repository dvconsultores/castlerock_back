import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './services/report.service';
import { ReportController } from './controllers/report.controller';
import { StudentEntity } from '../student/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity])],
  exports: [TypeOrmModule, ReportService],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
