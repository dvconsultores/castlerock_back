import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherEntity } from '../entities/teacher.entity';
import { CreateTeacherDto, TeacherDto, UpdateTeacherDto } from '../dto/teacher.dto';
import { plainToClass } from 'class-transformer';
import { UserService } from '../../user/services/user.service';
import { CreateUserDto } from '../../user/dto/user.dto';
import { UserRole } from '../../../shared/enums/user-role.enum';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(TeacherEntity)
    private readonly repository: Repository<TeacherEntity>,
    private readonly userService: UserService,
  ) {}

  async save(entity: TeacherEntity): Promise<TeacherEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateTeacherDto): Promise<TeacherEntity> {
    // const userDto: CreateUserDto = {
    //   ...dto.user,
    //   role: UserRole.TEACHER,
    // };

    // const user = await this.userService.create(userDto);

    // if (!user) {
    //   throw new InternalServerErrorException('Error creating user');
    // }

    // const teacherDto: TeacherDto = {
    //   user: user.id,
    //   campus: dto.campus,
    // };

    const newEntity = plainToClass(TeacherEntity, dto);

    return await this.repository.save(newEntity);
  }

  async findAll(campusId?: number): Promise<any[]> {
    const query = this.repository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.campus', 'campus')
      .select([
        'teacher',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phone',
        'user.image',
        'user.role',
        'campus.id',
        'campus.name',
      ]);

    if (campusId) {
      query.where('campus.id = :campusId', { campusId });
    }

    const teachers = await query.getMany();

    for (const teacher of teachers) {
      if (teacher.user) {
        delete (teacher.user as any).password;

        if ((teacher.user as any).tempPassword) {
          delete (teacher.user as any).tempPassword;
        }
      }
    }

    return teachers;
  }

  async findOne(id: number): Promise<TeacherEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<TeacherEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: relations,
    });
  }

  async findOneByUserId(userId: number, relations: string[]): Promise<TeacherEntity | null> {
    return await this.repository.findOne({
      where: { user: { id: userId } },
      relations: relations,
    });
  }

  async update(id: number, updateData: UpdateTeacherDto): Promise<void> {
    const teacher = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const { user: userData, ...teacherData } = updateData;

    Object.assign(teacher, teacherData);

    if (userData) {
      Object.assign(teacher.user, userData);
    }

    await this.repository.save(teacher);
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item no encontrado');
    }
  }
}
