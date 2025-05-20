import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';

export class CreateDailyScheduleDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  planningId: number;

  @ApiProperty()
  @IsEnum(WeekDayEnum)
  day: WeekDayEnum;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  teacherId: number;

  @ApiProperty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  studentIds: number[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDailyScheduleDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  planningId?: number;

  // @ApiProperty()
  // @IsOptional()
  // @IsEnum(WeekDayEnum)
  // day?: WeekDayEnum;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  teacherId?: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  studentIds?: number[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes?: string;
}
