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
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Post()
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
  async findAll(@User() user: AuthUser) {
    return this.campusService.findAll(user);
  }

  @Get(':campusId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async findOne(@User() user: AuthUser, @Param('campusId') id: number) {
    if (user.campusId !== id && user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.campusService.findOne(id);
  }

  @Patch(':campusId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update an campus with image upload',
    type: UpdateCampusDto,
  })
  async update(
    @User() user: AuthUser,
    @Param('campusId') id: number,
    @Body() body: UpdateCampusDto,
    @UploadedFile() image?: Multer.File,
  ) {
    if (user.campusId !== id && user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.campusService.update(id, body, image);
  }

  @Delete(':campusId')
  @Roles(UserRole.ADMIN)
  async remove(@User() user: AuthUser, @Param('campusId') id: number) {
    if (user.campusId !== id && user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.campusService.remove(id);
  }

  @Post(':campusId/assign-teacher')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async assignTeacher(@User() user: AuthUser, @Param('campusId') id: number, @Body() data: AssignTeacherDto) {
    if (user.campusId !== id && user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.campusService.assignTeacher(id, data);
  }

  @Delete(':campusId/remove-teacher')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async removeTeacher(@User() user: AuthUser, @Param('campusId') id: number, @Body() data: AssignTeacherDto) {
    if (user.campusId !== id && user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.campusService.removeTeacher(id, data);
  }
}
