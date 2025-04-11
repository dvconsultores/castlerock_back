import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusEntity } from './entities/campus.entity';
import { CampusService } from './services/campus.service';
import { CampusController } from './controllers/campus.controller';
import { TeacherModule } from '../teacher/teacher.module';

@Module({
  imports: [TypeOrmModule.forFeature([CampusEntity]), TeacherModule],
  exports: [CampusService],
  controllers: [CampusController],
  providers: [CampusService],
})
export class CampusModule {}
