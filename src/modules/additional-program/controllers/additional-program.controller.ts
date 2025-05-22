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
import { CreateAdditionalProgramDto, UpdateAdditionalProgramDto } from '../dto/additional-program.dto';
import { AdditionalProgramService } from '../services/additional-program.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

@ApiTags('Additional Programs')
@Controller('additional-programs')
export class AdditionalProgramController {
  constructor(private readonly additionalProgramService: AdditionalProgramService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create an additional program with image upload',
    type: CreateAdditionalProgramDto,
  })
  async create(@UploadedFile() image: Multer.File, @Body() body: CreateAdditionalProgramDto) {
    return this.additionalProgramService.create(body, image);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'campus', required: false, type: Number, description: 'Campus ID' })
  async findAll(@Query('campus') campusId?: number) {
    return this.additionalProgramService.findAll(campusId);
  }

  @Get(':additionalProgramId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('additionalProgramId') id: number) {
    return this.additionalProgramService.findOne(id);
  }

  @Patch(':additionalProgramId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update an additional program with image upload',
    type: UpdateAdditionalProgramDto,
  })
  async update(
    @Param('additionalProgramId') id: number,
    @Body() body: UpdateAdditionalProgramDto,
    @UploadedFile() image: Multer.File,
  ) {
    return this.additionalProgramService.update(id, body, image);
  }

  @Delete(':additionalProgramId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async remove(@Param('additionalProgramId') id: number) {
    return this.additionalProgramService.remove(id);
  }
}
