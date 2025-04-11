import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassService } from './services/class.service';
import { ClassController } from './controllers/class.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity])],
  exports: [ClassService],
  controllers: [ClassController],
  providers: [ClassService],
})
export class ClassModule {}
