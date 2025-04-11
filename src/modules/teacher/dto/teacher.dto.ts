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

export class CreateTeacherDto {
  @ApiProperty()
  @IsNumber()
  user: number;

  @ApiProperty()
  @IsNumber()
  campus: number;
}

export class UpdateTeacherDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  campus?: number;
}

export class AssignTeacherDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  teacherId: number;
}
