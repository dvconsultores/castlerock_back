import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsNumber, IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ required: false, description: 'ID del campus (solo para Super Admins)' })
  @IsNumber()
  @IsOptional()
  campusId?: number;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

export class RegisterSchoolDto {
  // --- Datos del Usuario (Dueño) ---
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  // --- Datos del Campus (Escuela) ---
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  schoolAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  schoolPhone: string;

  // --- Datos de la Suscripción ---
  @ApiProperty({ description: 'ID del plan seleccionado (Mensual/Anual)' })
  @IsNumber()
  @IsNotEmpty()
  planId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentMethodId?: string; // ID del método de pago (Stripe/MercadoPago)
}
