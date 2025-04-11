import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningEntity } from '../entities/planning.entity';
import { CreatePlanningDto, UpdatePlanningDto, PlanningDto } from '../dto/planning.dto';
import { plainToClass } from 'class-transformer';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { UserService } from '../../user/services/user.service';
import { CampusService } from '../../campus/services/campus.service';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(PlanningEntity)
    private readonly repository: Repository<PlanningEntity>,
    private readonly campusService: CampusService,
    private readonly userService: UserService,
  ) {}

  async save(entity: PlanningEntity): Promise<PlanningEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreatePlanningDto, adminId: number): Promise<any> {
    const campus = await this.campusService.findOne(dto.campusId);

    if (!campus) {
      throw new NotFoundException('Sede no encontrada');
    }

    const user = await this.userService.findOne(adminId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const inputDate = new Date(dto.date);

    const utcDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));

    const startDate = startOfWeek(utcDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(utcDate, { weekStartsOn: 1 });

    const year = inputDate.getFullYear();
    const week = this.getWeekNumber(inputDate);

    const planningDto: PlanningDto = {
      year,
      week,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      admin: user,
      campus,
    };

    const newEntity = this.repository.create(plainToClass(PlanningEntity, planningDto));

    return await this.repository.save(newEntity);
  }

  async findAll(): Promise<PlanningEntity[]> {
    return await this.repository.find();
  }

  async findOne(id: number): Promise<PlanningEntity | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<PlanningEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: relations,
    });
  }

  async update(id: number, updateData: UpdatePlanningDto): Promise<void> {
    const updateResult = await this.repository.update({ id }, plainToClass(PlanningEntity, updateData));
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

  private getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
