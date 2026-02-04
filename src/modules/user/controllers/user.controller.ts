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
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { User } from '../../../helpers/decorators/user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
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
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':userId')
  async findOne(@User() user: AuthUser, @Param('userId') id: number) {
    if (user.id !== id && user.role !== UserRole.ADMIN) {
      throw new Error('You do not have permission to access this user');
    }
    return this.userService.findOne(id);
  }

  @Patch(':userId')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update a user with image upload',
    type: UpdateUserDto,
  })
  async update(
    @User() user: AuthUser,
    @Param('userId') id: number,
    @Body() body: UpdateUserDto,
    @UploadedFile() image: Multer.File,
  ) {
    if (user.id !== id && user.role !== UserRole.ADMIN) {
      throw new Error('You do not have permission to access this user');
    }
    return this.userService.update(id, body, image);
  }

  @Delete(':userId')
  @Roles(UserRole.ADMIN)
  async remove(@Param('userId') id: number) {
    return this.userService.remove(id);
  }
}
