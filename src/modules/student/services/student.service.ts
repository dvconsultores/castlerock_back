import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { CreateStudentDto, UpdateStudentDto } from '../dto/student.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { ContactPersonEntity } from '../entities/contact-person.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repository: Repository<StudentEntity>,
    @InjectRepository(ContactPersonEntity)
    private readonly contactPersonRepository: Repository<ContactPersonEntity>,
  ) {}

  async save(entity: StudentEntity): Promise<StudentEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateStudentDto): Promise<any> {
    const newEntity = plainToClass(StudentEntity, dto);
    const saved = await this.repository.save(newEntity);
    return instanceToPlain(saved);
  }

  async findAll(): Promise<any[]> {
    const students = await this.repository.find();
    return students.map((student) => instanceToPlain(student));
  }

  async findOne(id: string): Promise<any> {
    const student = await this.repository.findOne({
      where: { id },
    });

    return student ? instanceToPlain(student) : null;
  }

  async findOneWithRelations(id: string, relations: string[]): Promise<any> {
    const student = await this.repository.findOne({
      where: { id },
      relations,
    });

    return student ? instanceToPlain(student) : null;
  }

  async update(id: string, updateData: UpdateStudentDto): Promise<void> {
    try {
      const student = await this.repository.findOne({ where: { id } });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      const { contacts, ...rest } = updateData;
      Object.assign(student, rest);

      if (contacts) {
        await this.contactPersonRepository.delete({ student: { id } });

        student.contacts = contacts.map((contact) =>
          plainToClass(ContactPersonEntity, {
            ...contact,
            student: { id },
          }),
        );
      }

      await this.repository.save(student);
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async remove(id: string): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Student not found');
    }
  }
}
