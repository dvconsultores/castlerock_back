import { ApiProperty, PartialType } from '@nestjs/swagger';
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
  IsArray,
} from 'class-validator';
import { ProgramType } from '../../../shared/enums/program-type.enum';
import { DayOfWeekEnum } from '../../../shared/enums/days-of-week.enum';

export class CreateAdditionalProgramDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  campus: number;

  @ApiProperty({ type: [String], enum: DayOfWeekEnum, isArray: true })
  @IsArray()
  @IsEnum(DayOfWeekEnum, { each: true })
  daysEnrolled: DayOfWeekEnum[];
}

export class UpdateAdditionalProgramDto extends PartialType(CreateAdditionalProgramDto) {}
