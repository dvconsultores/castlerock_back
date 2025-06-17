import {
  ForbiddenException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampusEntity } from '../entities/campus.entity';
import { CreateCampusDto, UpdateCampusDto } from '../dto/campus.dto';
import { plainToClass } from 'class-transformer';
import { TeacherService } from '../../teacher/services/teacher.service';
import { AssignTeacherDto } from '../../teacher/dto/teacher.dto';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { StorageService } from '../../../shared/storage/storage.service';
import { Multer } from 'multer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { StudentService } from '../../student/services/student.service';

@Injectable()
export class CampusService {
  constructor(
    @InjectRepository(CampusEntity)
    private readonly campusRepository: Repository<CampusEntity>,
    private readonly teacherService: TeacherService,
    private readonly storageService: StorageService,
  ) {}

  async save(entity: CampusEntity): Promise<CampusEntity> {
    return await this.campusRepository.save(entity);
  }

  async create(dto: CreateCampusDto, image?: Multer.File): Promise<CampusEntity> {
    let imageUrl: string | null = null;

    if (image) {
      imageUrl = await this.storageService.upload(image);
      dto.image = imageUrl;
    }

    const newEntity = plainToClass(CampusEntity, dto);

    return await this.campusRepository.save(newEntity);
  }

  async findAll(user: AuthUser): Promise<CampusEntity[]> {
    if (user.role === UserRole.ADMIN) {
      return await this.campusRepository.find();
    } else if (user.role === UserRole.TEACHER) {
      const teacher = await this.teacherService.findOneWithRelations(user.id, ['user', 'campus']);

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      return [teacher.campus];
    } else {
      throw new ForbiddenException(`User role ${user.role} not allowed to access this resource`);
    }
  }

  async findOne(id: number): Promise<CampusEntity | null> {
    return await this.campusRepository
      .createQueryBuilder('campus')
      .leftJoinAndSelect('campus.teachers', 'teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .select([
        'campus.id',
        'campus.name',
        'campus.nickname',
        'campus.address',
        'campus.phone',
        'campus.image',
        'campus.createdAt',
        'teacher.id',
        'user.firstName',
        'user.lastName',
        'user.email',
      ])
      .where('campus.id = :id', { id })
      .getOne();
  }

  async update(id: number, updateData: UpdateCampusDto, image?: Multer.File): Promise<void> {
    try {
      let imageUrl: string | undefined;

      if (image) {
        imageUrl = await this.storageService.upload(image);
        updateData.image = imageUrl;
      }

      const updateResult = await this.campusRepository.update({ id }, plainToClass(CampusEntity, updateData));
      if (updateResult.affected === 0) {
        throw new NotFoundException('Item not found');
      }
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.campusRepository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item no encontrado');
    }
  }

  async assignTeacher(campusId: number, { teacherId }: AssignTeacherDto) {
    const campus = await this.campusRepository.findOne({ where: { id: campusId } });

    if (!campus) throw new NotFoundException(`Campus with ID ${campusId} not found`);

    const teacher = await this.teacherService.findOneWithRelations(teacherId, ['user']);
    if (!teacher) throw new NotFoundException(`Teacher with ID ${teacherId} not found`);

    teacher.campus = campus;

    await this.teacherService.save(teacher);

    return { message: `Maestro ${teacher.user.firstName} asignado a la sede ${campus.name}` };
  }

  async removeTeacher(campusId: number, { teacherId }: AssignTeacherDto) {
    const campus = await this.campusRepository.findOne({ where: { id: campusId } });

    if (!campus) throw new NotFoundException(`Sede con ID ${campusId} no encontrada`);

    const teacher = await this.teacherService.findOneWithRelations(teacherId, ['campus', 'user']);

    if (!teacher) throw new NotFoundException(`Maestro con ID ${teacherId} no encontrado`);

    if (!teacher.campus || teacher.campus.id !== campusId) {
      throw new NotFoundException(`Maestro ${teacher.user.firstName} no está asignado al campus ${campus.name}`);
    }

    teacher.campus = null as any;

    await this.teacherService.save(teacher);

    return { message: `Maestro ${teacher.user.firstName} removido de la sede ${campus.name}` };
  }
}
