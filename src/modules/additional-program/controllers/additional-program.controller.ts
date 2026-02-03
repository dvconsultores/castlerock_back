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
import { User } from '../../../helpers/decorators/user.decorator';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';

@ApiTags('Additional Programs')
@Controller('additional-programs')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AdditionalProgramController {
  constructor(private readonly additionalProgramService: AdditionalProgramService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create an additional program with image upload',
    type: CreateAdditionalProgramDto,
  })
  async create(@User() user: AuthUser, @UploadedFile() image: Multer.File, @Body() body: CreateAdditionalProgramDto) {
    return this.additionalProgramService.create(user, body, image);
  }

  @Get()
  @ApiQuery({ name: 'campus', required: false, type: Number, description: 'Campus ID' })
  async findAll(@User() user: AuthUser, @Query('campus') campusId?: number) {
    return this.additionalProgramService.findAll(user.campusId || campusId);
  }

  @Get(':additionalProgramId')
  async findOne(@User() user: AuthUser, @Param('additionalProgramId') id: number) {
    return this.additionalProgramService.findOne(user, id);
  }

  @Patch(':additionalProgramId')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update an additional program with image upload',
    type: UpdateAdditionalProgramDto,
  })
  async update(
    @User() user: AuthUser,
    @Param('additionalProgramId') id: number,
    @Body() body: UpdateAdditionalProgramDto,
    @UploadedFile() image: Multer.File,
  ) {
    return this.additionalProgramService.update(user, id, body, image);
  }

  @Delete(':additionalProgramId')
  @Roles(UserRole.ADMIN)
  async remove(@User() user: AuthUser, @Param('additionalProgramId') id: number) {
    return this.additionalProgramService.remove(user, id);
  }
}
