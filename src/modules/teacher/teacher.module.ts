import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherEntity } from './entities/teacher.entity';
import { TeacherService } from './services/teacher.service';
import { TeacherController } from './controllers/teacher.controller';
import { UserModule } from '../user/user.module';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherEntity]), UserModule, ClassModule],
  exports: [TeacherService],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
