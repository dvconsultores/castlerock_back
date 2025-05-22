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
  IsObject,
} from 'class-validator';
import { UserEntity } from '../../user/entities/user.entity';
import { CampusEntity } from '../../campus/entities/campus.entity';
import { Type } from 'class-transformer';
import { ClassEntity } from '../../class/entities/class.entity';

export class CreatePlanningDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  month: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  week?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  campus: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  class: number;
}

export class UpdatePlanningDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  date?: string;
}

export class PlanningDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  month: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  week: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  campus: CampusEntity;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  class: ClassEntity;
}

export class FindPlanningDtoQuery {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  campus: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  class: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  year: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  month: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  week?: number;
}
