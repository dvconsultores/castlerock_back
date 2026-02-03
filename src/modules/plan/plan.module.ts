import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntity } from './entities/plan.entity';
import { PlanService } from './services/plan.service';
import { PlanController } from './controllers/plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlanEntity])],
  exports: [PlanService],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}
