import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherEntity } from './entities/teacher.entity';
import { TeacherService } from './services/teacher.service';
import { TeacherController } from './controllers/teacher.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherEntity])],
  exports: [TeacherService],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
