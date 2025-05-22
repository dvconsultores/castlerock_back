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
import { CreateCampusDto, UpdateCampusDto } from '../dto/campus.dto';
import { CampusService } from '../services/campus.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { AssignTeacherDto } from '../../teacher/dto/teacher.dto';
import { User } from '../../../helpers/decorators/user.decorator';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

@ApiTags('Campus')
@Controller('campus')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create an campus with image upload',
    type: CreateCampusDto,
  })
  async create(@Body() body: CreateCampusDto, @UploadedFile() image?: Multer.File) {
    return this.campusService.create(body, image);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async findAll(@User() user: AuthUser) {
    return this.campusService.findAll(user);
  }

  @Get(':campusId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async findOne(@Param('campusId') id: number) {
    return this.campusService.findOne(id);
  }

  @Patch(':campusId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update an campus with image upload',
    type: UpdateCampusDto,
  })
  async update(@Param('campusId') id: number, @Body() body: UpdateCampusDto, @UploadedFile() image?: Multer.File) {
    return this.campusService.update(id, body, image);
  }

  @Delete(':campusId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async remove(@Param('campusId') id: number) {
    return this.campusService.remove(id);
  }

  @Post(':campusId/assign-teacher')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async assignTeacher(@Param('campusId') id: number, @Body() data: AssignTeacherDto) {
    return this.campusService.assignTeacher(id, data);
  }

  @Delete(':campusId/remove-teacher')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async removeTeacher(@Param('campusId') id: number, @Body() data: AssignTeacherDto) {
    return this.campusService.removeTeacher(id, data);
  }
}
