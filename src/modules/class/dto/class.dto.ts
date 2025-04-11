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

export class CreateClassDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  maxCapacity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  campus: number;
}

export class UpdateClassDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  maxCapacity?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  campus?: number;
}
