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
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';

@ApiTags('Additional Programs')
@Controller('additional-programs')
export class AdditionalProgramController {
  constructor(private readonly additionalProgramService: AdditionalProgramService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateAdditionalProgramDto) {
    return this.additionalProgramService.create(body);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'campus', required: false, type: Number, description: 'Campus ID' })
  async findAll(@Query('campus') campusId?: number) {
    return this.additionalProgramService.findAll(campusId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: number) {
    return this.additionalProgramService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() body: UpdateAdditionalProgramDto) {
    return this.additionalProgramService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    return this.additionalProgramService.remove(id);
  }
}
