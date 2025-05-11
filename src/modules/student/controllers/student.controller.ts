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

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
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
    @Body() body: CreateStudentDto,
    @UploadedFiles()
    files: {
      image?: Multer.File[];
      imageContactPrimary?: Multer.File[];
      imageContactSecondary?: Multer.File[];
    },
  ) {
    return this.studentService.create(
      body,
      files.image?.[0],
      files.imageContactPrimary?.[0],
      files.imageContactSecondary?.[0],
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findByParams(@Query(new ValidationPipe({ transform: true })) query: FindStudentDtoQuery) {
    return this.studentService.findByParams(query);
  }

  @Get(':studentId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('studentId') id: number) {
    return this.studentService.findOne(id);
  }

  @Patch(':studentId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  async remove(@Param('studentId') id: number) {
    return this.studentService.remove(id);
  }
}
