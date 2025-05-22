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

@ApiTags('Attendances')
@Controller('attendances')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async create(@Body() body: CreateAttendanceDto) {
    return this.attendanceService.create(body);
  }

  @Post('bulk')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: CreateAttendanceDto, isArray: true })
  async createMany(@Body() body: CreateAttendanceDto[]) {
    return this.attendanceService.createMany(body);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findByParams(@Query(new ValidationPipe({ transform: true })) query: FindAttendanceDtoQuery) {
    return this.attendanceService.findByParams(query);
  }

  @Get(':attendanceId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('attendanceId') id: number) {
    return this.attendanceService.findOne(id);
  }

  @Patch(':attendanceId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async update(@Param('attendanceId') id: number, @Body() body: UpdateAttendanceDto) {
    return this.attendanceService.update(id, body);
  }

  @Delete(':attendanceId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async remove(@Param('attendanceId') id: number) {
    return this.attendanceService.remove(id);
  }
}
