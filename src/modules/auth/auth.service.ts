import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpCustomService } from '../../shared/http/http.service';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/services/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CampusService } from '../campus/services/campus.service';
import { TeacherService } from '../teacher/services/teacher.service';
import { UserRole } from '../../shared/enums/user-role.enum';
import { CampusEntity } from '../campus/entities/campus.entity';
import { AppLogger } from '../../shared/logger/app-logger';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly campusService: CampusService,
    private readonly teacherService: TeacherService,
    private readonly jwtService: JwtService,
  ) {}

  private async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.userService.findOneByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: { id: number; email: string; role: UserRole; campusId?: number } = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    let campus: CampusEntity | null = null;

    if (user.role === UserRole.TEACHER) {
      const teacher = await this.teacherService.findOneByUserId(user.id, ['user', 'campus']);

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      campus = await this.campusService.findOne(teacher.campus.id);

      if (!campus) {
        throw new NotFoundException('Campus not found');
      }

      payload.campusId = campus.id;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      campus,
    };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000);
    const token = otp.toString();

    await this.userService.update(user.id, { resetToken: token });

    console.log(`Send email to ${email} with reset token: ${token}`);

    return { message: 'Reset token sent to email' };
  }

  async resetPassword({ email, token, newPassword }: ResetPasswordDto) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) throw new BadRequestException('User not found');

    if (user.resetToken !== token) throw new BadRequestException('Invalid token');

    user.resetToken = null as any;
    user.password = newPassword;

    await this.userService.save(user);

    return { message: 'Password reset successfully' };
  }
}
