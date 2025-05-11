import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
  ) {}

  async save(entity: NotificationEntity): Promise<NotificationEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const newEntity = this.repository.create({ ...dto, user: { id: dto.userId } });

    return await this.repository.save(newEntity);
  }

  async findByUserId(userId: number): Promise<NotificationEntity[]> {
    return await this.repository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<NotificationEntity | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateData: Partial<NotificationEntity>): Promise<void> {
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
