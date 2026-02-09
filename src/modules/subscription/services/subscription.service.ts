import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { CreateSubscriptionDto } from '../dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
  ) {}

  async save(entity: SubscriptionEntity): Promise<SubscriptionEntity> {
    return await this.repository.save(entity);
  }

  // async create(dto: CreateSubscriptionDto): Promise<SubscriptionEntity> {
  //   const newEntity = this.repository.create({ ...dto, user: { id: dto.userId } });

  //   return await this.repository.save(newEntity);
  // }

  async findOne(id: number): Promise<SubscriptionEntity | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findByFilter(filter: any): Promise<SubscriptionEntity[]> {
    return await this.repository.find(filter);
  }

  async update(id: number, updateData: Partial<SubscriptionEntity>): Promise<void> {
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

  async findOneByCampusId(campusId: number): Promise<SubscriptionEntity | null> {
    try {
      return await this.repository.findOne({
        where: { campus: { id: campusId } },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar la suscripción por campusId');
    }
  }
}
