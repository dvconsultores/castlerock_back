import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpCustomService } from '../../shared/http/http.service';
import { ForgotPasswordDto, LoginDto, RegisterSchoolDto, ResetPasswordDto } from './dto/auth.dto';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/services/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CampusService } from '../campus/services/campus.service';
import { TeacherService } from '../teacher/services/teacher.service';
import { UserRole } from '../../shared/enums/user-role.enum';
import { CampusEntity } from '../campus/entities/campus.entity';
import { AppLogger } from '../../shared/logger/app-logger';
import { MailService } from '../../shared/mail/mail.service';
import { DataSource } from 'typeorm';
import { SubscriptionEntity } from '../subscription/entities/subscription.entity';
import { PlanEntity } from '../plan/entities/plan.entity';
import { SubscriptionStatus } from '../../shared/enums/subscription-status.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly campusService: CampusService,
    private readonly teacherService: TeacherService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
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

    if (user.role === UserRole.ADMIN) {
      // campus = await this.campusService.findOne(loginDto.campusId!);
      // if (!campus) {
      //   throw new NotFoundException('Campus not found for owner');
      // }
      // payload.campusId = user.campus.id;
    } else if (user.role === UserRole.TEACHER) {
      const teacher = await this.teacherService.findOneByUserId(user.id, ['user', 'campus']);

      if (teacher) {
        campus = await this.campusService.findOne(teacher.campus.id);

        if (!campus) {
          throw new NotFoundException('Campus not found');
        }

        payload.campusId = campus.id;
      }
    } else if (user.role === UserRole.OWNER) {
      campus = await this.campusService.findOne(user.campus.id);

      if (!campus) {
        throw new NotFoundException('Campus not found for owner');
      }

      payload.campusId = campus.id;
    } else {
      throw new BadRequestException('Unsupported user role for login');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      image: user.image,
      accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      campus: {
        id: campus?.id,
        name: campus?.name,
        nickname: campus?.nickname,
      },
    };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000);
    const token = otp.toString();

    await this.userService.update(user.id, { resetToken: token, resetTokenAt: new Date() });

    console.log(`Send email to ${email} with reset token: ${token}`);

    await this.mailService.sendEmail({
      to: email,
      subject: 'Password Reset',
      template: './reset-password-en',
      context: {
        otp: token,
      },
    });

    console.log('Email sent successfully');

    return { message: 'Reset token sent to email' };
  }

  async resetPassword({ email, token, newPassword }: ResetPasswordDto) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) throw new BadRequestException('User not found');

    if (user.resetToken !== token) throw new BadRequestException('Invalid token');

    if (!user.resetTokenAt) {
      throw new BadRequestException('Invalid or missing token timestamp');
    }

    const now = new Date();

    const tokenAge = now.getTime() - new Date(user.resetTokenAt).getTime();

    if (tokenAge > 60 * 60 * 1000) {
      throw new BadRequestException('Token has expired');
    }

    user.resetToken = null as any;
    user.resetTokenAt = null as any;
    user.password = newPassword;

    await this.userService.save(user);

    return { message: 'Password reset successfully' };
  }

  async registerSchool(dto: RegisterSchoolDto) {
    // 1. Validar si el usuario ya existe antes de abrir transacción (ahorra recursos)
    const existingUser = await this.userService.findOneByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('The email is already in use');
    }

    // 2. Iniciar Transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtenemos los repositorios DESDE el manager de la transacción
      const userRepo = queryRunner.manager.getRepository(UserEntity);
      const campusRepo = queryRunner.manager.getRepository(CampusEntity);
      const subRepo = queryRunner.manager.getRepository(SubscriptionEntity);
      const planRepo = queryRunner.manager.getRepository(PlanEntity);

      // A. Buscar el Plan
      const plan = await planRepo.findOne({ where: { id: dto.planId } });

      if (!plan) throw new NotFoundException('Plan not found');

      // B. Crear Usuario (Owner)
      const newUser = userRepo.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
        role: UserRole.OWNER,
      });

      const savedUser = await userRepo.save(newUser);

      // C. Crear Campus
      const newCampus = campusRepo.create({
        name: dto.schoolName,
        address: dto.schoolAddress,
        phone: dto.schoolPhone,
        nickname: dto.schoolName.substring(0, 3).toUpperCase(),
        image: '', // O una imagen por defecto
        users: [savedUser], // Vinculamos la relación
      });

      const savedCampus = await campusRepo.save(newCampus);

      // D. Crear Suscripción (Trial o Pendiente)
      const newSubscription = subRepo.create({
        campus: savedCampus,
        plan: plan,
        status: SubscriptionStatus.TRIAL, // O ACTIVE si cobras luego
        startDate: new Date(),
        nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 30)), // +30 días de prueba
      });

      await subRepo.save(newSubscription);

      // E. Confirmar Transacción
      await queryRunner.commitTransaction();

      // F. Retornar respuesta (similar al Login para entrar directo)
      const payload = {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        campusId: savedCampus.id,
      };

      return {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        image: savedUser.image,
        accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
        campus: {
          id: savedCampus.id,
          name: savedCampus.name,
          nickname: savedCampus.nickname,
        },
        // message: 'School registered successfully',
      };
    } catch (err) {
      // Si algo falla, revertimos TODO (no se crea usuario ni campus)
      await queryRunner.rollbackTransaction();

      // Relanzamos el error para que Nest lo maneje
      if (err instanceof ConflictException || err instanceof NotFoundException) {
        throw err;
      }
      console.error(err);
      throw new InternalServerErrorException('Error registering school');
    } finally {
      // Liberar conexión
      await queryRunner.release();
    }
  }
}
