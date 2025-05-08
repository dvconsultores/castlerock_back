import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdditionalProgramEntity } from '../entities/additional-program.entity';
import { CreateAdditionalProgramDto, UpdateAdditionalProgramDto } from '../dto/additional-program.dto';
import { plainToClass } from 'class-transformer';
import { Multer } from 'multer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { StorageService } from '../../../shared/storage/storage.service';

@Injectable()
export class AdditionalProgramService {
  constructor(
    @InjectRepository(AdditionalProgramEntity)
    private readonly repository: Repository<AdditionalProgramEntity>,
    private readonly storageService: StorageService,
  ) {}

  async save(entity: AdditionalProgramEntity): Promise<AdditionalProgramEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateAdditionalProgramDto, image?: Multer.File): Promise<AdditionalProgramEntity> {
    try {
      let imageUrl: string | null = null;

      if (image) {
        imageUrl = await this.storageService.upload(image);
      }

      const newEntity = plainToClass(AdditionalProgramEntity, { ...dto, image: imageUrl });

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

  async findOne(id: number): Promise<AdditionalProgramEntity | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<AdditionalProgramEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: relations,
    });
  }

  async update(id: number, updateData: UpdateAdditionalProgramDto, image?: Multer.File): Promise<void> {
    try {
      let imageUrl: string | undefined;

      if (image) {
        imageUrl = await this.storageService.upload(image);
      }

      const updateResult = await this.repository.update(
        { id },
        plainToClass(AdditionalProgramEntity, { ...updateData, image: imageUrl }),
      );
      if (updateResult.affected === 0) {
        throw new NotFoundException('Item not found');
      }
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }
}
