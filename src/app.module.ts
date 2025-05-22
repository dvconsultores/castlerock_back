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
import { StorageModule } from './shared/storage/storage.module';
import { DailyScheduleModule } from './modules/daily-schedule/daily-schedule.module';
import { AttendanceModule } from './modules/attendance/attendance.module';

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
    AuthModule,
    UtilsModule,
    LoggerModule,
    HttpCustomModule,
    UserModule,
    TeacherModule,
    NotificationModule,
    CampusModule,
    StudentModule,
    ClassModule,
    PlanningModule,
    AdditionalProgramModule,
    MailModule,
    StorageModule,
    DailyScheduleModule,
    AttendanceModule,
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
