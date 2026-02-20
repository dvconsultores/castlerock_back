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
import { DataSource, Repository } from 'typeorm';
import { SubscriptionEntity } from '../subscription/entities/subscription.entity';
import { BillingCycle, PlanEntity } from '../plan/entities/plan.entity';
import { SubscriptionStatus } from '../../shared/enums/subscription-status.enum';
import { PlanService } from '../plan/services/plan.service';
import { StripeService } from '../../providers/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly campusService: CampusService,
    private readonly teacherService: TeacherService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
    private readonly planService: PlanService,
    private readonly stripeService: StripeService,
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

    console.log('User logged in:', user);

    const payload: { id: number; email: string; role: UserRole; campusId?: number } = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    let campus: CampusEntity | null = null;

    let subscription: SubscriptionEntity | null = null;

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

      subscription = campus.subscriptions[0] || null;

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
      subscription: subscription,
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
    // 1. Validar usuario
    const existingUser = await this.userService.findOneByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('The email is already in use');
    }

    // 2. Buscar plan (ANTES de Stripe / TX)
    const plan = await this.planService.findOne(dto.planId);

    if (!plan) throw new NotFoundException('Plan not found');

    // 3. Variables Stripe
    let stripeCustomerId: string | undefined = undefined;
    let stripeSubscriptionId: string | undefined = undefined;
    let nextBillingDate: Date;

    /* ============================
     CASO TRIAL
  ============================ */
    if (plan.billingCycle === BillingCycle.TRIAL) {
      nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + 15);
    } else {
      /* ============================
     CASO PAGO
  ============================ */
      // const paymentMethod = await this.stripeService.getClient().paymentMethods.create({
      //   type: 'card',
      //   card: {
      //     token: 'tok_visa', // 👈 tarjeta 4242
      //   },
      // });

      // console.log('Created payment method:', paymentMethod);

      // dto.paymentMethodId = paymentMethod.id;

      if (!dto.paymentMethodId) {
        throw new BadRequestException('Payment method is required');
      }

      if (!plan.externalPriceId) {
        throw new InternalServerErrorException('Plan is not linked with Stripe');
      }

      try {
        /* 1️⃣ Crear Customer */
        const customer = await this.stripeService.getClient().customers.create({
          email: dto.email,
          name: dto.schoolName,
          payment_method: dto.paymentMethodId,
          invoice_settings: {
            default_payment_method: dto.paymentMethodId,
          },
        });

        console.log('Created Stripe customer:', customer);

        stripeCustomerId = customer.id;

        /* 2️⃣ Crear Subscription */
        const subscription = (await this.stripeService.getClient().subscriptions.create({
          customer: customer.id,
          items: [
            {
              price: plan.externalPriceId,
            },
          ],
          expand: ['latest_invoice.payment_intent'],
        })) as any;

        console.log('Created Stripe subscription:', subscription);
        stripeSubscriptionId = subscription.id;

        /* 3️⃣ Fecha real desde Stripe */
        nextBillingDate = new Date(subscription.current_period_end * 1000);
      } catch (error) {
        console.error('Stripe error:', error);
        throw new BadRequestException('Payment failed');
      }
    }

    /* ============================
     TRANSACCIÓN DB
  ============================ */

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(UserEntity);
      const campusRepo = queryRunner.manager.getRepository(CampusEntity);
      const subRepo = queryRunner.manager.getRepository(SubscriptionEntity);

      /* A. Usuario */
      const newUser = userRepo.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
        role: UserRole.OWNER,
      });

      const savedUser = await userRepo.save(newUser);

      /* B. Campus */
      const newCampus = campusRepo.create({
        name: dto.schoolName,
        address: dto.schoolAddress,
        phone: dto.schoolPhone,
        nickname: dto.schoolName.substring(0, 3).toUpperCase(),
        image: '',
        users: [savedUser],
        stripeCustomerId,
      });

      const savedCampus = await campusRepo.save(newCampus);

      /* C. Subscription */
      const newSubscription = subRepo.create({
        campus: savedCampus,
        plan,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        nextBillingDate,
        externalSubscriptionId: stripeSubscriptionId,
      });

      const savedSubscription = await subRepo.save(newSubscription);

      /* D. Commit */
      await queryRunner.commitTransaction();

      /* E. JWT */
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
        accessToken: this.jwtService.sign(payload, {
          expiresIn: '7d',
        }),
        campus: {
          id: savedCampus.id,
          name: savedCampus.name,
          nickname: savedCampus.nickname,
        },
        subscription: {
          id: savedSubscription.id,
          status: savedSubscription.status,
          nextBillingDate: savedSubscription.nextBillingDate,
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();

      console.error(err);

      throw new InternalServerErrorException('Error registering school');
    } finally {
      await queryRunner.release();
    }
  }
}
