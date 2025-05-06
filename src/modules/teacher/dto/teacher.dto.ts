import { ApiProperty, OmitType } from '@nestjs/swagger';
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
  ValidateNested,
} from 'class-validator';
import { CreateUserDto, UpdateUserDto } from '../../user/dto/user.dto';
import { Type } from 'class-transformer';

// export class CreateTeacherDto extends OmitType(CreateUserDto, ['role'] as const) {
//   @ApiProperty()
//   @IsNumber()
//   @IsNotEmpty()
//   campus: number;
// }

export class OmitCreateUserDto extends OmitType(CreateUserDto, ['role'] as const) {}
export class OmitUpdateUserDto extends OmitType(UpdateUserDto, ['role'] as const) {}

export class CreateTeacherDto {
  @ApiProperty({ type: OmitType(CreateUserDto, ['role'] as const) })
  @ValidateNested()
  @Type(() => OmitCreateUserDto)
  user: OmitCreateUserDto;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  campus: number;
}

export class TeacherDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  user: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  campus: number;
}

export class UpdateTeacherDto {
  @ApiProperty({ type: OmitUpdateUserDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OmitUpdateUserDto)
  user?: OmitUpdateUserDto;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  campus?: number;
}

export class AssignTeacherDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  teacherId: number;
}
