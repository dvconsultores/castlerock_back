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
} from 'class-validator';
import { NotificationStatus } from '../../../shared/enums/notification-status.enum';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  // @ApiProperty()
  // @IsOptional()
  // branchId?: number;
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
