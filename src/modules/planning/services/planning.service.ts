import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningEntity } from '../entities/planning.entity';
import { CreatePlanningDto, UpdatePlanningDto, PlanningDto, FindPlanningDtoQuery } from '../dto/planning.dto';
import { plainToClass } from 'class-transformer';
import {
  startOfWeek,
  endOfWeek,
  format,
  startOfMonth,
  addWeeks,
  isSameMonth,
  endOfMonth,
  setMilliseconds,
  setSeconds,
  setMinutes,
  setHours,
  addDays,
} from 'date-fns';
import { UserService } from '../../user/services/user.service';
import { CampusService } from '../../campus/services/campus.service';
import { ClassService } from '../../class/services/class.service';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(PlanningEntity)
    private readonly repository: Repository<PlanningEntity>,
    private readonly campusService: CampusService,
    private readonly userService: UserService,
    private readonly classService: ClassService,
  ) {}

  async save(entity: PlanningEntity): Promise<PlanningEntity> {
    return await this.repository.save(entity);
  }

  async create(dto: CreatePlanningDto): Promise<PlanningEntity> {
    const planningFound = await this.findOneByParams({
      campus: dto.campus,
      class: dto.class,
      year: dto.year,
      month: dto.month,
      week: dto.week,
    });

    if (planningFound) {
      return planningFound;
    }

    const campus = await this.campusService.findOne(dto.campus);

    if (!campus) {
      throw new NotFoundException('Sede not found');
    }

    const classFound = await this.classService.findOne(dto.class);

    if (!classFound) {
      throw new NotFoundException('Clase not found');
    }

    const { startDate, endDate } = this.getWeekRange(dto.year, dto.month, dto.week!);

    const planningDto: PlanningDto = {
      year: dto.year,
      month: dto.month,
      week: dto.week!,
      startDate,
      endDate,
      campus,
      class: classFound,
    };

    const newEntity = this.repository.create(plainToClass(PlanningEntity, planningDto));

    return await this.repository.save(newEntity);
  }

  async findAll(): Promise<PlanningEntity[]> {
    return await this.repository.find({
      relations: [
        'campus',
        'class',
        'dailySchedules',
        'dailySchedules.teachers',
        'dailySchedules.students',
        'dailySchedules.teachers.user',
      ],
    });
  }

  async findByParams(query: FindPlanningDtoQuery): Promise<PlanningEntity[]> {
    const { campus, class: classId, year, month, week } = query;

    const filters = {
      campus: { id: campus },
      class: { id: classId },
      year,
      month,
      ...(week !== undefined && { week }),
    };

    const planning = await this.repository.find({
      where: filters,
      relations: [
        'campus',
        'class',
        'dailySchedules',
        'dailySchedules.teachers',
        'dailySchedules.students',
        'dailySchedules.teachers.user',
      ],
    });

    return planning;
  }

  async findOneByParams(query: FindPlanningDtoQuery): Promise<PlanningEntity | null> {
    const { campus, class: classId, year, month, week } = query;

    const filters = {
      campus: { id: campus },
      class: { id: classId },
      year,
      month,
      ...(week !== undefined && { week }),
    };

    return await this.repository.findOne({
      where: filters,
      relations: ['campus', 'class', 'dailySchedules', 'dailySchedules.teachers', 'dailySchedules.students'],
    });
  }

  async findOne(id: number): Promise<PlanningEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['campus', 'class'],
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
      throw new NotFoundException('Item not found');
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  private getWeekRange(year: number, month: number, weekNumber: number): { startDate: string; endDate: string } {
    const baseDate = new Date(Date.UTC(year, month - 1, 1));
    const targetMonth = baseDate.getUTCMonth();

    let firstFriday = baseDate;
    while (firstFriday.getUTCDay() !== 5) {
      firstFriday = addDays(firstFriday, 1);
    }

    let currentMonday = startOfWeek(firstFriday, { weekStartsOn: 1 });

    let currentWeek = 1;

    while (true) {
      const weekStart = currentMonday;
      const weekEnd = addDays(weekStart, 4);

      if (weekEnd.getUTCMonth() !== targetMonth) {
        break;
      }

      if (currentWeek === weekNumber) {
        return {
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
        };
      }

      currentWeek++;
      currentMonday = addWeeks(currentMonday, 1);
    }

    throw new BadRequestException(`The specified week (${weekNumber}) does not exist for the given month`);
  }
}
