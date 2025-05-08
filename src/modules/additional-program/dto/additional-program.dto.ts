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

  @ApiProperty({ type: [String], enum: DayOfWeekEnum, isArray: true })
  @ToArray()
  @IsArray()
  @IsEnum(DayOfWeekEnum, { each: true })
  days: DayOfWeekEnum[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  image: any;
}

export class UpdateAdditionalProgramDto extends PartialType(CreateAdditionalProgramDto) {}
