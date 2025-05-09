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
import { ProgramType } from '../../../shared/enums/program-type.enum';

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

  @ApiProperty({ enum: ProgramType })
  @IsNotEmpty()
  @IsEnum(ProgramType)
  program: ProgramType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
  })
  image: string;
}

export class ClassDto extends CreateClassDto {
  // @ApiProperty()
  // @IsOptional()
  // @IsString()
  // image?: string;
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

  @ApiProperty({ enum: ProgramType })
  @IsOptional()
  @IsEnum(ProgramType)
  program?: ProgramType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  image?: string;
}
