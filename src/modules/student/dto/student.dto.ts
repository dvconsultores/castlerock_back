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
  IsInt,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { RelationshipType } from '../../../shared/enums/relationship-type.enum';
import { ToArray } from '../../../helpers/decorators/to-array.decorator';
import { ProgramType } from '../../../shared/enums/program-type.enum';
import { ToEmptyArray } from '../../../helpers/decorators/to-empty-array.decorator';

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
  @Transform(({ value }) => {
    if (value === 'null' || value === null || value === '') {
      return null;
    }
    return new Date(value);
  })
  @IsDate()
  endDateOfClasses?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateOfClasses?: Date;

  @ApiProperty({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  // @ToEmptyArray()
  @ToArray()
  daysEnrolled: WeekDayEnum[];

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  // @ToEmptyArray()
  @ToArray()
  beforeSchoolDays?: WeekDayEnum[];

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  // @ToEmptyArray()
  @ToArray()
  afterSchoolDays?: WeekDayEnum[];

  @ApiPropertyOptional({ type: [Number], isArray: true })
  @IsOptional()
  @Transform(({ value }) => {
    const raw =
      value == null || value === ''
        ? []
        : Array.isArray(value)
          ? value
          : typeof value === 'string'
            ? value.split(',')
            : [value];
    const nums = raw
      .map((v) => (typeof v === 'string' ? v.trim() : v))
      .filter((v) => v !== '' && v !== null && v !== undefined)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
    return nums;
  })
  @IsArray()
  @IsInt({ each: true })
  classIds: number[];

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  // @IsDateString()
  // @Type(() => Date)
  @Transform(({ value }) => (value === '' ? null : value))
  startDateOfClassesTransition?: any;

  @ApiProperty({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  // @ToEmptyArray()
  @ToArray()
  daysEnrolledTransition?: WeekDayEnum[];

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  // @ToEmptyArray()
  @ToArray()
  beforeSchoolDaysTransition?: WeekDayEnum[];

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  // @ToEmptyArray()
  @ToArray()
  afterSchoolDaysTransition?: WeekDayEnum[];

  @ApiPropertyOptional({ type: [Number], isArray: true })
  @IsOptional()
  @Transform(({ value }) => {
    const raw =
      value == null || value === ''
        ? []
        : Array.isArray(value)
          ? value
          : typeof value === 'string'
            ? value.split(',')
            : [value];
    const nums = raw
      .map((v) => (typeof v === 'string' ? v.trim() : v))
      .filter((v) => v !== '' && v !== null && v !== undefined)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
    return nums;
  })
  @IsArray()
  @IsInt({ each: true })
  classIdsTransition: number[];

  @ApiPropertyOptional({ type: [Number], isArray: true })
  @IsOptional()
  @Transform(({ value }) => {
    const raw =
      value == null || value === ''
        ? []
        : Array.isArray(value)
          ? value
          : typeof value === 'string'
            ? value.split(',')
            : [value];
    const nums = raw
      .map((v) => (typeof v === 'string' ? v.trim() : v))
      .filter((v) => v !== '' && v !== null && v !== undefined)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
    return nums;
  })
  @IsArray()
  @IsInt({ each: true })
  additionalProgramIds: number[];

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  campus: number;

  @ApiProperty({ type: [CreateContactPersonDto] })
  @Transform(({ value }) => {
    try {
      if (!value) return [];

      if (typeof value === 'string') {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      }

      if (Array.isArray(value)) {
        const flattened = value.flat();
        return flattened.map((item) => (typeof item === 'string' ? JSON.parse(item) : item));
      }

      return [];
    } catch (err) {
      console.error('Failed to transform contacts:', err);
      return [];
    }
  })
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

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  weeklyAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  monthlyAmount: number;
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
  @ToArray()
  dayEnrolled?: WeekDayEnum;

  @ApiProperty({ required: false, enum: ProgramType })
  @IsOptional()
  @IsEnum(ProgramType)
  program?: ProgramType;

  @ApiProperty({
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Ordenar por fecha de fin de clases (solo los que la tienen)',
  })
  @IsOptional()
  endDateOrder?: 'ASC' | 'DESC';

  @ApiProperty({
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Ordenar por fecha de inicio de transición (solo los que la tienen)',
  })
  @IsOptional()
  transitionStartOrder?: 'ASC' | 'DESC';
}
