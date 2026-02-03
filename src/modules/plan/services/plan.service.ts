import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';
import { CreatePlanDto } from '../dto/plan.dto';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly repository: Repository<PlanEntity>,
  ) {}

  async save(entity: PlanEntity): Promise<PlanEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreatePlanDto): Promise<PlanEntity> {
    return await this.repository.save(dto);
  }

  async findOne(id: number): Promise<PlanEntity | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<PlanEntity[]> {
    return await this.repository.find();
  }

  async update(id: number, updateData: Partial<PlanEntity>): Promise<void> {
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
