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
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateAttendanceDto, FindAttendanceDtoQuery, UpdateAttendanceDto } from '../dto/attendance.dto';
import { AttendanceService } from '../services/attendance.service';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { User } from '../../../helpers/decorators/user.decorator';

@ApiTags('Attendances')
@Controller('attendances')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  async create(@Body() body: CreateAttendanceDto) {
    return this.attendanceService.create(body);
  }

  @Post('bulk')
  @ApiBody({ type: CreateAttendanceDto, isArray: true })
  async createMany(@Body() body: CreateAttendanceDto[]) {
    return this.attendanceService.createMany(body);
  }

  @Get()
  async findByParams(
    @User() user: AuthUser,
    @Query(new ValidationPipe({ transform: true })) query: FindAttendanceDtoQuery,
  ) {
    return this.attendanceService.findByParams(user, query);
  }

  @Get(':attendanceId')
  async findOne(@User() user: AuthUser, @Param('attendanceId') id: number) {
    return this.attendanceService.findOne(user, id);
  }

  @Patch(':attendanceId')
  async update(@User() user: AuthUser, @Param('attendanceId') id: number, @Body() body: UpdateAttendanceDto) {
    return this.attendanceService.update(user, id, body);
  }

  @Delete(':attendanceId')
  async remove(@User() user: AuthUser, @Param('attendanceId') id: number) {
    return this.attendanceService.remove(user, id);
  }
}
