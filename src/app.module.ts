import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/app.config';
import { AppController } from './app.controller';
import { UtilsModule } from './shared/utils/utils.module';
import { DatabaseConfig } from './config/database/database.config';
import { HttpCustomModule } from './shared/http/http.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/user/user.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CampusModule } from './modules/campus/campus.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { AuthModule } from './modules/auth/auth.module';
import { StudentModule } from './modules/student/student.module';
import { ClassModule } from './modules/class/class.module';
import { PlanningModule } from './modules/planning/planning.module';
import { LoggerModule } from './shared/logger/logger.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './shared/mail/mail.module';
import { AdditionalProgramModule } from './modules/additional-program/additional-program.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 30,
        },
      ],
    }),
    AppConfigModule,
    CacheModule.register({ isGlobal: true }),
    TypeOrmModule.forRoot(DatabaseConfig.getDataSourceOptions()),
    UtilsModule,
    LoggerModule,
    HttpCustomModule,
    UserModule,
    NotificationModule,
    CampusModule,
    TeacherModule,
    AuthModule,
    StudentModule,
    ClassModule,
    PlanningModule,
    MailModule,
    AdditionalProgramModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
