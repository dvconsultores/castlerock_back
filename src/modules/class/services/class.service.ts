import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from '../entities/class.entity';
import { CreateClassDto, UpdateClassDto } from '../dto/class.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly repository: Repository<ClassEntity>,
  ) {}

  async save(entity: ClassEntity): Promise<ClassEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateClassDto): Promise<ClassEntity> {
    const newEntity = plainToClass(ClassEntity, dto);

    return await this.repository.save(newEntity);
  }

  async findAll(): Promise<ClassEntity[]> {
    return await this.repository.find();
  }

  async findOne(id: number): Promise<ClassEntity | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<ClassEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: relations,
    });
  }

  async update(id: number, updateData: UpdateClassDto): Promise<void> {
    const updateResult = await this.repository.update({ id }, plainToClass(ClassEntity, updateData));
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
