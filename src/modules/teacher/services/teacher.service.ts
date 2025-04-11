import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherEntity } from '../entities/teacher.entity';
import { CreateTeacherDto, UpdateTeacherDto } from '../dto/teacher.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(TeacherEntity)
    private readonly repository: Repository<TeacherEntity>,
  ) {}

  async save(entity: TeacherEntity): Promise<TeacherEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateTeacherDto): Promise<TeacherEntity> {
    const newEntity = plainToClass(TeacherEntity, dto);

    return await this.repository.save(newEntity);
  }

  async findAll(): Promise<TeacherEntity[]> {
    return await this.repository.find();
  }

  async findOne(id: number): Promise<TeacherEntity | null> {
    return await this.repository.findOne({
      where: { id },
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
    const updateResult = await this.repository.update({ id }, plainToClass(TeacherEntity, updateData));
    if (updateResult.affected === 0) {
      throw new NotFoundException('Item no encontrado');
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item no encontrado');
    }
  }
}
