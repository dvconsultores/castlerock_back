import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsString } from 'class-validator';
import { EnvironmentEnum } from '../shared/enums/environment.enum';

export class EnvironmentVariables {
  @IsEnum(EnvironmentEnum)
  NODE_ENV: EnvironmentEnum;

  @IsString()
  API_KEY!: string;

  @IsInt()
  PORT!: number;

  @IsString()
  HOST_ORM!: string;

  @IsString()
  DATABASE_ORM!: string;

  @IsString()
  USER_ORM!: string;

  @IsString()
  PASSWORD_ORM!: string;

  @IsInt()
  PORT_ORM!: number;

  @IsString()
  JWT_SECRET!: string;

  // @IsString()
  // LOGGER_CLIENT_EMAIL!: string;

  // @IsString()
  // LOGGER_PROJECT_ID!: string;

  // @IsString()
  // LOGGER_PRIVATE_KEY!: string;

  @IsString()
  MAIL_HOST!: string;

  @IsString()
  MAIL_USER!: string;

  @IsString()
  MAIL_PASSWORD!: string;

  @IsString()
  MAIL_FROM!: string;

  @IsString()
  DO_SPACES_KEY!: string;

  @IsString()
  DO_SPACES_SECRET!: string;

  @IsString()
  DO_SPACES_REGION!: string;

  @IsString()
  DO_SPACES_BUCKET!: string;

  @IsString()
  DO_SPACES_ENDPOINT!: string;
}
