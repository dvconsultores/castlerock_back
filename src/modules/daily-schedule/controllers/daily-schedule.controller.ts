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
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateDailyScheduleDto, UpdateDailyScheduleDto } from '../dto/daily-schedule.dto';
import { DailyScheduleService } from '../services/daily-schedule.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { User } from '../../../helpers/decorators/user.decorator';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';

@ApiTags('Daily Schedules')
@Controller('daily-schedules')
export class DailyScheduleController {
  constructor(private readonly dailyScheduleService: DailyScheduleService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiBody({
    description: 'Create a new dailySchedule',
    type: CreateDailyScheduleDto,
  })
  async create(@Body() body: CreateDailyScheduleDto, @User() user: AuthUser) {
    return this.dailyScheduleService.create(body, user.id);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('daily-schedules-find-all')
  @CacheTTL(60 * 1000)
  async findAll(@Query('day') day?: WeekDayEnum) {
    return this.dailyScheduleService.findAll(day);
  }

  @Get(':dailyScheduleId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('dailyScheduleId') id: number) {
    return this.dailyScheduleService.findOne(id);
  }

  @Patch(':dailyScheduleId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiBody({
    description: 'Update an dailySchedule',
    type: UpdateDailyScheduleDto,
  })
  async update(@Param('dailyScheduleId') id: number, @Body() body: UpdateDailyScheduleDto) {
    return this.dailyScheduleService.update(id, body);
  }

  @Delete(':dailyScheduleId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async remove(@Param('dailyScheduleId') id: number) {
    return this.dailyScheduleService.remove(id);
  }
}
