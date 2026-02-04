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
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClassDto, CreateClassDto, UpdateClassDto } from '../dto/class.dto';
import { ClassService } from '../services/class.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { User } from '../../../helpers/decorators/user.decorator';

@ApiTags('Classes')
@Controller('classes')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create an classroom with image upload',
    type: CreateClassDto,
  })
  async create(@User() user: AuthUser, @Body() body: CreateClassDto, @UploadedFile() image: Multer.File) {
    if (body.campus !== user.campusId) {
      throw new Error('Unauthorized');
    }
    return this.classService.create(user, body, image);
  }

  @Get()
  @ApiQuery({ name: 'campus', required: false, type: Number, description: 'Campus ID' })
  async findAll(@User() user: AuthUser, @Query('campus') campusId?: number) {
    if (campusId && campusId !== user.campusId) {
      throw new Error('Unauthorized');
    }
    return this.classService.findAll(campusId);
  }

  @Get(':classId')
  async findOne(@User() user: AuthUser, @Param('classId') id: number) {
    return this.classService.findOne(user, id);
  }

  @Patch(':classId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update an classroom with image upload',
    type: UpdateClassDto,
  })
  async update(
    @User() user: AuthUser,
    @Param('classId') id: number,
    @Body() body: UpdateClassDto,
    @UploadedFile() image: Multer.File,
  ) {
    return this.classService.update(user, id, body, image);
  }

  @Delete(':classId')
  async remove(@User() user: AuthUser, @Param('classId') id: number) {
    return this.classService.remove(user, id);
  }
}
