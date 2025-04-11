import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { EnvironmentVariables } from '../../config/env';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppLogger implements LoggerService {
  private logger: winston.Logger;
  private configService: ConfigService<EnvironmentVariables> = new ConfigService();

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level}: ${message}`;
          }),
        ),
      }),
    ];

    if (isProduction) {
      transports.push(
        new LoggingWinston({
          logName: this.configService.get('NODE_ENV'),
          projectId: this.configService.get('LOGGER_PROJECT_ID'),
          credentials: {
            client_email: this.configService.get('LOGGER_CLIENT_EMAIL'),
            private_key: this.configService.get('LOGGER_PRIVATE_KEY'),
          },
        }),
      );
    }

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports,
    });
  }

  log(message: string, metadata?: object) {
    try {
      if (message.startsWith('Mapped {')) return;
      if (message.includes('Controller {')) return;
      if (message.includes('dependencies initialized')) return;

      this.logger.info(message, metadata);
    } catch (error) {
      return;
    }
  }

  error(message: string, trace?: string, metadata?: object) {
    this.logger.error(message, { trace, ...metadata });
  }

  warn(message: string, metadata?: object) {
    this.logger.warn(message, metadata);
  }

  debug?(message: string, metadata?: object) {
    this.logger.debug(message, metadata);
  }

  verbose?(message: string, metadata?: object) {
    this.logger.verbose(message, metadata);
  }
}
