import { ApiProperty, OmitType } from '@nestjs/swagger';
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
  ValidateNested,
  IsArray,
} from 'class-validator';
import { CreateUserDto, UpdateUserDto } from '../../user/dto/user.dto';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  classId: number;

  @ApiProperty({ type: String, format: 'date' })
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsNotEmpty()
  endDate: string;
}
