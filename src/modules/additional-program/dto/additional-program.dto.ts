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
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { StringToNumber } from '../../../helpers/decorators/string-to-number.decorator';
import { ToArray } from '../../../helpers/decorators/to-array.decorator';

export class CreateAdditionalProgramDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @StringToNumber()
  @IsNumber()
  campus: number;

  @ApiProperty({ type: [String], enum: WeekDayEnum, isArray: true })
  @ToArray()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  days: WeekDayEnum[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  image: any;
}

export class UpdateAdditionalProgramDto extends PartialType(CreateAdditionalProgramDto) {}
