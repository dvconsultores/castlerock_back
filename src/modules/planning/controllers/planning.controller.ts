import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  Put,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreatePlanningDto, FindPlanningDtoQuery, UpdatePlanningDto } from '../dto/planning.dto';
import { PlanningService } from '../services/planning.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { PlanningEntity } from '../entities/planning.entity';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { User } from '../../../helpers/decorators/user.decorator';

@ApiTags('Planning')
@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreatePlanningDto, @User() user: AuthUser) {
    if (body.week) {
      return this.planningService.create(body, user.id);
    } else {
      const promises: any[] = [];

      for (let i = 1; i <= 6; i++) {
        const newBody = { ...body, week: i };
        promises.push(this.planningService.create(newBody, user.id));
      }

      const results = await Promise.allSettled(promises);

      const successfulPlannings: PlanningEntity[] = [];
      const failedWeeks: number[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulPlannings.push(result.value);
        } else {
          failedWeeks.push(index + 1);
          console.error(`Error in week ${index + 1}:`, result.reason);
        }
      });

      return successfulPlannings;
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findAll() {
    return this.planningService.findAll();
  }

  @Get('search')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findByParams(@Query(new ValidationPipe({ transform: true })) query: FindPlanningDtoQuery) {
    return this.planningService.findByParams(query);
  }

  @Get(':planningId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('planningId') id: number) {
    return this.planningService.findOne(id);
  }

  @Patch(':planningId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async update(@Param('planningId') id: number, @Body() body: UpdatePlanningDto) {
    return this.planningService.update(id, body);
  }

  @Delete(':planningId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async remove(@Param('planningId') id: number) {
    return this.planningService.remove(id);
  }
}
