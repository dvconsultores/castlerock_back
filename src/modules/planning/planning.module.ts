import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningEntity } from './entities/planning.entity';
import { PlanningService } from './services/planning.service';
import { PlanningController } from './controllers/planning.controller';
import { UserModule } from '../user/user.module';
import { CampusModule } from '../campus/campus.module';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlanningEntity]), UserModule, CampusModule, ClassModule],
  exports: [PlanningService],
  controllers: [PlanningController],
  providers: [PlanningService],
})
export class PlanningModule {}
