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
import { SubscriptionStatus } from '../../../shared/enums/subscription-status.enum';

export class CreateSubscriptionDto {
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

export class UpdateSubscriptionDto {
  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // message?: string;

  @ApiProperty()
  @IsEnum(SubscriptionStatus)
  @IsNotEmpty()
  status: SubscriptionStatus;
}
