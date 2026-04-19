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
  UploadedFiles,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateStudentDto, FindStudentDtoQuery, UpdateStudentDto } from '../dto/student.dto';
import { StudentService } from '../services/student.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { User } from '../../../helpers/decorators/user.decorator';

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'imageContactPrimary', maxCount: 1 },
      { name: 'imageContactSecondary', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create a student with image upload',
    type: CreateStudentDto,
  })
  async create(
    @User() user: AuthUser,
    @Body() body: CreateStudentDto,
    @UploadedFiles()
    files: {
      image?: Multer.File[];
      imageContactPrimary?: Multer.File[];
      imageContactSecondary?: Multer.File[];
    },
  ) {
    if (String(body.campus) !== String(user.campusId)) {
      throw new Error('Unauthorized');
    }
    return this.studentService.create(
      user,
      body,
      files.image?.[0],
      files.imageContactPrimary?.[0],
      files.imageContactSecondary?.[0],
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findByParams(
    @User() user: AuthUser,
    @Query(new ValidationPipe({ transform: true })) query: FindStudentDtoQuery,
  ) {
    return this.studentService.findByParams(user, query);
  }

  @Get(':studentId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@User() user: AuthUser, @Param('studentId') id: number) {
    return this.studentService.findOne(user, id);
  }

  @Patch(':studentId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'imageContactPrimary', maxCount: 1 },
      { name: 'imageContactSecondary', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update an student with image upload',
    type: UpdateStudentDto,
  })
  async update(
    @User() user: AuthUser,
    @Param('studentId') id: number,
    @Body() body: UpdateStudentDto,
    @UploadedFiles()
    files: {
      image?: Multer.File[];
      imageContactPrimary?: Multer.File[];
      imageContactSecondary?: Multer.File[];
    },
  ) {
    return this.studentService.update(
      user,
      id,
      body,
      files.image?.[0],
      files.imageContactPrimary?.[0],
      files.imageContactSecondary?.[0],
    );
  }

  @Delete(':studentId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async remove(@User() user: AuthUser, @Param('studentId') id: number) {
    return this.studentService.remove(user, id);
  }
}
