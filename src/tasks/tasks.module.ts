import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { StudentEntity } from '../modules/student/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity])],
  controllers: [],
  providers: [TasksService],
})
export class TasksModule {}
