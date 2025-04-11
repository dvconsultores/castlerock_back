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

export class CreatePlanningDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  campusId: number;
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
  admin: UserEntity;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  campus: CampusEntity;
}
