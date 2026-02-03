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
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';
import { PlanService } from '../services/plan.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { User } from '../../../helpers/decorators/user.decorator';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';

@ApiTags('Plans')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  // @Roles(UserRole.ADMIN)
  async create(@Body() body: CreatePlanDto) {
    return this.planService.create(body);
  }

  @Get()
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  async findAll() {
    return this.planService.findAll();
  }

  // @Get(':planId')
  // async findOne(@Param('planId') id: number) {
  //   return this.planService.findOne(id);
  // }

  @Patch(':planId')
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  async update(@Param('planId') id: number, @Body() body: UpdatePlanDto) {
    return this.planService.update(id, body);
  }

  @Delete(':planId')
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  async remove(@Param('planId') id: number) {
    return this.planService.remove(id);
  }
}
