import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(entity: UserEntity): Promise<UserEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const newEntity = this.repository.create(dto);

    return await this.repository.save(newEntity);
  }

  async findAll(): Promise<Partial<UserEntity>[]> {
    return await this.repository.find({
      select: ['id', 'firstName', 'lastName', 'email'],
    });
  }

  async findOne(id: number): Promise<UserEntity | null> {
    return await this.repository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email'],
    });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return await this.repository.findOne({
      where: { email },
    });
  }

  async update(id: number, updateData: Partial<UserEntity>): Promise<void> {
    const updateResult = await this.repository.update({ id }, updateData);
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
