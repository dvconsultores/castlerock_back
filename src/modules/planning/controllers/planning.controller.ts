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

@ApiTags('Planning')
@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreatePlanningDto, @Req() req: Request) {
    if (body.week) {
      return this.planningService.create(body);
    } else {
      const plannings: PlanningEntity[] = [];

      for (let i = 1; i <= 6; i++) {
        const newBody = { ...body, week: i };

        try {
          const created = await this.planningService.create(newBody);
          plannings.push(created);
        } catch (error) {
          console.log(`Error creating planning for week ${i}:`, error);
        }
      }

      return plannings;
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
