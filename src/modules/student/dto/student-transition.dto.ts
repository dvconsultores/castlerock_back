import { IsArray, IsDate, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { ToArray } from '../../../helpers/decorators/to-array.decorator';

const toIntArray = ({ value }: { value: any }): number[] => {
  const raw =
    value == null || value === ''
      ? []
      : Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',')
          : [value];
  return raw
    .map((v) => (typeof v === 'string' ? v.trim() : v))
    .filter((v) => v !== '' && v !== null && v !== undefined)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
};

export class CreateStudentTransitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;

  @ApiProperty({ type: String, format: 'date' })
  @Transform(({ value }) => (value === '' || value === null ? null : new Date(value)))
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  @ToArray()
  daysEnrolled?: WeekDayEnum[];

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  @ToArray()
  beforeSchoolDays?: WeekDayEnum[];

  @ApiPropertyOptional({ type: [String], enum: WeekDayEnum, isArray: true })
  @IsOptional()
  @ToArray()
  afterSchoolDays?: WeekDayEnum[];

  @ApiProperty({ type: [Number], isArray: true })
  @Transform(toIntArray)
  @IsArray()
  @IsInt({ each: true })
  classIds: number[];
}
