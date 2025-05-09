import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { CreateStudentDto, UpdateStudentDto } from '../dto/student.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { ContactPersonEntity } from '../entities/contact-person.entity';
import { StorageService } from '../../../shared/storage/storage.service';
import { Multer } from 'multer';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repository: Repository<StudentEntity>,
    @InjectRepository(ContactPersonEntity)
    private readonly contactPersonRepository: Repository<ContactPersonEntity>,
    private readonly storageService: StorageService,
  ) {}

  async save(entity: StudentEntity): Promise<StudentEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateStudentDto, image?: Multer.File): Promise<any> {
    let imageUrl: string | null = null;

    if (image) {
      imageUrl = await this.storageService.upload(image);
      dto.image = imageUrl;
    }

    const newEntity = plainToClass(StudentEntity, dto);
    const saved = await this.repository.save(newEntity);
    return instanceToPlain(saved);
  }

  async findAll(campusId?: number): Promise<any[]> {
    const query = this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .select(['student', 'campus.id', 'campus.name']);

    if (campusId) {
      query.where('campus.id = :campusId', { campusId });
    }

    const students = await query.getMany();
    return students.map((student) => instanceToPlain(student));
  }

  async findOne(id: number): Promise<any> {
    const student = await this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .select(['student', 'campus.id', 'campus.name'])
      .where('student.id = :id', { id })
      .getOne();

    return student ? instanceToPlain(student) : null;
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<any> {
    const student = await this.repository.findOne({
      where: { id },
      relations,
    });

    return student ? instanceToPlain(student) : null;
  }

  async update(id: number, updateData: UpdateStudentDto, image?: Multer.File): Promise<void> {
    try {
      const student = await this.repository.findOne({ where: { id } });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      let imageUrl: string | undefined;

      if (image) {
        imageUrl = await this.storageService.upload(image);
        updateData.image = imageUrl;
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

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Student not found');
    }
  }
}
