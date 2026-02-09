import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { CampusModule } from '../campus/campus.module';
import { TeacherModule } from '../teacher/teacher.module';
import { PlanModule } from '../plan/plan.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    UserModule,
    CampusModule,
    TeacherModule,
    PlanModule,
    SubscriptionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
