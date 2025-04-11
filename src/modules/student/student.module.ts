import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { StudentService } from './services/student.service';
import { StudentController } from './controllers/student.controller';
import { ContactPersonEntity } from './entities/contact-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity, ContactPersonEntity])],
  exports: [StudentService],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
