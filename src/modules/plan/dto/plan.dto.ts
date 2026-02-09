import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsPositive, IsArray } from 'class-validator';
import { PlanStatus } from '../../../shared/enums/plan-status.enum';
import { BillingCycle } from '../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({ example: 'Plan Premium' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  @IsNotEmpty()
  billingCycle: BillingCycle;

  @ApiProperty({
    example: 'price_1P2x3y4z',
    description: 'ID del precio en Stripe o pasarela externa',
  })
  @IsString()
  @IsOptional()
  externalPriceId?: string;
}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  @ApiProperty({ enum: PlanStatus, required: false })
  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;
}
