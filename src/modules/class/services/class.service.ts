import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClassEntity } from '../entities/class.entity';
import { ClassDto, CreateClassDto, UpdateClassDto } from '../dto/class.dto';
import { plainToClass } from 'class-transformer';
import { StorageService } from '../../../shared/storage/storage.service';
import { Multer } from 'multer';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly repository: Repository<ClassEntity>,
    private readonly storageService: StorageService,
  ) {}

  async save(entity: ClassEntity): Promise<ClassEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: ClassDto, image?: Multer.File): Promise<ClassEntity> {
    let imageUrl: string | null = null;

    if (image) {
      imageUrl = await this.storageService.upload(image);
      dto.image = imageUrl;
    }

    const newEntity = plainToClass(ClassEntity, dto);

    return await this.repository.save(newEntity);
  }

  async findAll(campusId?: number): Promise<ClassEntity[]> {
    return await this.repository.find({
      where: campusId ? { campus: { id: campusId } } : {},
      relations: ['campus'],
    });
  }

  async findOne(id: number): Promise<ClassEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['campus'],
    });
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<ClassEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: relations,
    });
  }

  async update(id: number, updateData: UpdateClassDto, image?: Multer.File): Promise<void> {
    let imageUrl: string | undefined;

    if (image) {
      imageUrl = await this.storageService.upload(image);
      updateData.image = imageUrl;
    }

    const updateResult = await this.repository.update({ id }, plainToClass(ClassEntity, updateData));
    if (updateResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async findByIds(ids: number[]): Promise<ClassEntity[]> {
    return await this.repository.findBy({ id: In(ids) });
  }
}
