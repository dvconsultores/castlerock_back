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
import { DailySchedulesCacheInterceptor } from '../../../helpers/interceptors/daily-schedules-cache-interceptor';

@ApiTags('Daily Schedules')
@Controller('daily-schedules')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DailyScheduleController {
  constructor(private readonly dailyScheduleService: DailyScheduleService) {}

  @Post()
  @ApiBody({
    description: 'Create a new dailySchedule',
    type: CreateDailyScheduleDto,
  })
  async create(@User() user: AuthUser, @Body() body: CreateDailyScheduleDto) {
    return this.dailyScheduleService.create(user, body, user.id);
  }

  @Get()
  // @UseInterceptors(DailySchedulesCacheInterceptor)
  // @CacheTTL(60 * 1000)
  async findAll(@User() user: AuthUser, @Query('date') date?: string) {
    return this.dailyScheduleService.findAll(user, date);
  }

  @Get(':dailyScheduleId')
  async findOne(@User() user: AuthUser, @Param('dailyScheduleId') id: number) {
    return this.dailyScheduleService.findOne(user, id);
  }

  @Patch(':dailyScheduleId')
  @ApiBody({
    description: 'Update an dailySchedule',
    type: UpdateDailyScheduleDto,
  })
  async update(@User() user: AuthUser, @Param('dailyScheduleId') id: number, @Body() body: UpdateDailyScheduleDto) {
    return this.dailyScheduleService.update(user, id, body);
  }

  @Delete(':dailyScheduleId')
  async remove(@User() user: AuthUser, @Param('dailyScheduleId') id: number) {
    return this.dailyScheduleService.remove(user, id);
  }
}
