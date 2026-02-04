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
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { User } from '../../../helpers/decorators/user.decorator';

@ApiTags('Teachers')
@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async create(@User() user: AuthUser, @Body() body: CreateTeacherDto) {
    return this.teacherService.create(user, body);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findAll(@User() user: AuthUser) {
    return this.teacherService.findAll(user);
  }

  @Get(':teacherId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@User() user: AuthUser, @Param('teacherId') id: number) {
    return this.teacherService.findOne(user, id);
  }

  @Patch(':teacherId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async update(@User() user: AuthUser, @Param('teacherId') id: number, @Body() body: UpdateTeacherDto) {
    return this.teacherService.update(user, id, body);
  }

  @Delete(':teacherId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async remove(@User() user: AuthUser, @Param('teacherId') id: number) {
    return this.teacherService.remove(user, id);
  }
}
