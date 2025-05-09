import { IsString, IsDate, IsEnum, IsOptional, IsArray, ValidateNested, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DayOfWeekEnum } from '../../../shared/enums/days-of-week.enum';
import { RelationshipType } from '../../../shared/enums/relationship-type.enum';

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

  // @ApiProperty()
  // @IsUUID()
  // student: string;
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

  image: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateOfClasses?: Date;

  @ApiProperty({ type: [String], enum: DayOfWeekEnum, isArray: true })
  @IsArray()
  @IsEnum(DayOfWeekEnum, { each: true })
  daysEnrolled: DayOfWeekEnum[];

  @ApiPropertyOptional({ type: [String], enum: DayOfWeekEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeekEnum, { each: true })
  beforeSchoolDays?: DayOfWeekEnum[];

  @ApiPropertyOptional({ type: [String], enum: DayOfWeekEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeekEnum, { each: true })
  afterSchoolDays?: DayOfWeekEnum[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        programId: { type: 'number' },
        sessions: { type: 'number' },
        duration: { type: 'string' },
      },
    },
  })
  @IsOptional()
  @IsArray()
  additionalPrograms?: {
    programId: number;
    sessions: number;
    duration: string;
  }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  campus?: string;

  @ApiProperty({ type: [CreateContactPersonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactPersonDto)
  contacts: CreateContactPersonDto[];
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
