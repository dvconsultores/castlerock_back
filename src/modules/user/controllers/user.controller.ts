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
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { UserService } from '../services/user.service';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create a user with image upload',
    type: CreateUserDto,
  })
  async create(@Body() body: CreateUserDto, @UploadedFile() image?: Multer.File) {
    return this.userService.create(body, image);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':userId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('userId') id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':userId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update a user with image upload',
    type: UpdateUserDto,
  })
  async update(@Param('userId') id: number, @Body() body: UpdateUserDto, @UploadedFile() image: Multer.File) {
    return this.userService.update(id, body, image);
  }

  @Delete(':userId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async remove(@Param('userId') id: number) {
    return this.userService.remove(id);
  }
}
