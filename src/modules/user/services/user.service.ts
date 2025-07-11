import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from '../dto/user.dto';
import { Multer } from 'multer';
import { StorageService } from '../../../shared/storage/storage.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly storageService: StorageService,
  ) {}

  async save(entity: UserEntity): Promise<UserEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateUserDto, image?: Multer.File): Promise<UserEntity> {
    let imageUrl: string | null = null;

    if (image) {
      imageUrl = await this.storageService.upload(image);
      dto.image = imageUrl;
    }

    const newEntity = this.repository.create(dto);

    return await this.repository.save(newEntity);
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.repository.find({
      select: ['id', 'firstName', 'lastName', 'email', 'image', 'role', 'phone'],
    });
  }

  async findOne(id: number): Promise<UserEntity | null> {
    return await this.repository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'image', 'role', 'phone'],
    });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return await this.repository.findOne({
      where: { email },
    });
  }

  async update(id: number, updateData: Partial<UserEntity>, image?: Multer.File): Promise<void> {
    let imageUrl: string | undefined;

    if (image) {
      imageUrl = await this.storageService.upload(image);
      updateData.image = imageUrl;
    }

    const updateResult = await this.repository.update({ id }, updateData);
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
}
