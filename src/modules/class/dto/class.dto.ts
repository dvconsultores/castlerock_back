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
import { StringToNumber } from '../../../helpers/decorators/string-to-number.decorator';
import { ClassType } from '../../../shared/enums/class-type.enum';

export class CreateClassDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @StringToNumber()
  @IsInt()
  maxCapacity: number;

  @ApiProperty()
  @IsNotEmpty()
  @StringToNumber()
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

  @ApiProperty({ enum: ClassType })
  @IsOptional()
  @IsEnum(ClassType)
  classType: ClassType;
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
  @StringToNumber()
  @IsInt()
  maxCapacity?: number;

  @ApiProperty()
  @IsOptional()
  @StringToNumber()
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

  @ApiProperty({ enum: ClassType })
  @IsOptional()
  @IsEnum(ClassType)
  classType?: ClassType;
}
