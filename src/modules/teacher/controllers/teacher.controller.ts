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
import { CreateTeacherDto, UpdateTeacherDto } from '../dto/teacher.dto';
import { TeacherService } from '../services/teacher.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';

@ApiTags('Teachers')
@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateTeacherDto) {
    return this.teacherService.create(body);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findAll() {
    return this.teacherService.findAll();
  }

  @Get(':teacherId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('teacherId') id: number) {
    return this.teacherService.findOne(id);
  }

  @Patch(':teacherId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async update(@Param('teacherId') id: number, @Body() body: UpdateTeacherDto) {
    return this.teacherService.update(id, body);
  }

  @Delete(':teacherId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async remove(@Param('teacherId') id: number) {
    return this.teacherService.remove(id);
  }
}
