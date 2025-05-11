import {
  IsString,
  IsDate,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { RelationshipType } from '../../../shared/enums/relationship-type.enum';
import { ToArray } from '../../../helpers/decorators/to-array.decorator';

export class CreateContactPersonDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  relation: RelationshipType;

  @ApiProperty({ enum: ['PRIMARY', 'SECONDARY', 'EMERGENCY_1', 'EMERGENCY_2'] })
  @IsEnum(['PRIMARY', 'SECONDARY', 'EMERGENCY_1', 'EMERGENCY_2'])
  role: 'PRIMARY' | 'SECONDARY' | 'EMERGENCY_1' | 'EMERGENCY_2';

  image: string;
}

export class UpdateContactPersonDto extends PartialType(CreateContactPersonDto) {}

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @ApiProperty({ enum: ['M', 'F', 'Other'] })
  @IsEnum(['M', 'F', 'Other'])
  gender: 'M' | 'F' | 'Other';

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateOfClasses?: Date;

  @ApiProperty({ type: [String], enum: WeekDayEnum, isArray: true })
  @ToArray()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  daysEnrolled: WeekDayEnum[];

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  beforeSchoolDays?: WeekDayEnum[];

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(WeekDayEnum, { each: true })
  afterSchoolDays?: WeekDayEnum[];

  @ApiProperty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  additionalProgramIds: number[];

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  campus: string;

  @ApiProperty({ type: [CreateContactPersonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactPersonDto)
  contacts: CreateContactPersonDto[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
  })
  image: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  imageContactPrimary: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  imageContactSecondary: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

export class FindStudentDtoQuery {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  campusId?: number;

  @ApiProperty({ required: false, enum: WeekDayEnum })
  @IsOptional()
  @IsEnum(WeekDayEnum)
  dayEnrolled?: WeekDayEnum;
}
