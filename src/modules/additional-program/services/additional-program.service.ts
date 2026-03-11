import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdditionalProgramEntity } from '../entities/additional-program.entity';
import { CreateAdditionalProgramDto, UpdateAdditionalProgramDto } from '../dto/additional-program.dto';
import { plainToClass } from 'class-transformer';
import { Multer } from 'multer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { StorageService } from '../../../shared/storage/storage.service';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { StudentEntity } from '../../student/entities/student.entity';

@Injectable()
export class AdditionalProgramService {
  constructor(
    @InjectRepository(AdditionalProgramEntity)
    private readonly repository: Repository<AdditionalProgramEntity>,
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
    private readonly storageService: StorageService,
  ) {}

  async save(entity: AdditionalProgramEntity): Promise<AdditionalProgramEntity> {
    return await this.repository.save(entity);
  }

  async create(user: AuthUser, dto: CreateAdditionalProgramDto, image?: Multer.File): Promise<AdditionalProgramEntity> {
    try {
      let imageUrl: string | null = null;

      if (image) {
        imageUrl = await this.storageService.upload(image);
        dto.image = imageUrl;
      }

      const newEntity = plainToClass(AdditionalProgramEntity, { ...dto, campus: user.campusId });

      return await this.repository.save(newEntity);
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async findAll(campusId?: number): Promise<AdditionalProgramEntity[]> {
    const query = this.repository
      .createQueryBuilder('additional_program')
      .leftJoinAndSelect('additional_program.campus', 'campus')
      .select(['additional_program', 'campus.id', 'campus.name']);

    if (campusId) {
      query.where('campus.id = :campusId', { campusId });
    }

    const additionalPrograms = await query.getMany();

    return additionalPrograms;
  }

  async findOne(user: AuthUser, id: number): Promise<AdditionalProgramEntity | null> {
    return await this.repository.findOne({
      where: { id, campus: { id: user.campusId } },
      relations: ['campus'],
      select: {
        id: true,
        name: true,
        image: true,
        days: true,
        campus: {
          id: true,
          name: true,
        },
      },
    });
  }

  async findAllWithStudents(campusId?: number): Promise<any[]> {
    console.log('Finding all additional programs with students for campusId:', campusId);

    // 1️⃣ obtener programs
    const programsQuery = this.repository
      .createQueryBuilder('additional_program')
      .leftJoinAndSelect('additional_program.campus', 'campus')
      .select(['additional_program', 'campus.id', 'campus.name']);

    if (campusId) {
      programsQuery.where('campus.id = :campusId', { campusId });
    }

    const programs = await programsQuery.getMany();

    if (!programs.length) return [];

    const programIds = programs.map((p) => p.id);

    // 2️⃣ obtener estudiantes
    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.additionalPrograms', 'program')
      .select(['student.id', 'student.firstName', 'student.lastName', 'program.id'])
      .where('program.id IN (:...programIds)', { programIds })
      .getMany();

    // 3️⃣ agrupar estudiantes por programa
    const programStudentsMap: any = new Map<number, any[]>();

    students.forEach((student) => {
      student.additionalPrograms.forEach((program) => {
        if (!programStudentsMap.has(program.id)) {
          programStudentsMap.set(program.id, []);
        }

        programStudentsMap.get(program.id).push({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
        });
      });
    });

    // 4️⃣ añadir students a cada program
    const result = programs.map((program) => ({
      ...program,
      students: programStudentsMap.get(program.id) || [],
    }));

    return result;
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<AdditionalProgramEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: relations,
    });
  }

  async update(user: AuthUser, id: number, updateData: UpdateAdditionalProgramDto, image?: Multer.File): Promise<void> {
    try {
      let imageUrl: string | undefined;

      if (image) {
        imageUrl = await this.storageService.upload(image);
        updateData.image = imageUrl;
      }

      const updateResult = await this.repository.update(
        { id, campus: { id: user.campusId } },
        plainToClass(AdditionalProgramEntity, updateData),
      );
      if (updateResult.affected === 0) {
        throw new NotFoundException('Item not found');
      }
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async remove(user: AuthUser, id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id, campus: { id: user.campusId } });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async findByIds(ids: number[]): Promise<AdditionalProgramEntity[]> {
    return await this.repository.findBy({ id: In(ids) });
  }
}
