import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsInt,
  IsDate,
  IsEmail,
  MinLength,
  IsNumber,
} from 'class-validator';
import { NotificationStatus } from '../../../shared/enums/notification-status.enum';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}

export class UpdateNotificationDto {
  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // message?: string;

  @ApiProperty()
  @IsEnum(NotificationStatus)
  @IsNotEmpty()
  status: NotificationStatus;
}
