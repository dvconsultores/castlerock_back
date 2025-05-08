import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdditionalProgramEntity } from './entities/additional-program.entity';
import { AdditionalProgramService } from './services/additional-program.service';
import { AdditionalProgramController } from './controllers/additional-program.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdditionalProgramEntity])],
  exports: [AdditionalProgramService],
  controllers: [AdditionalProgramController],
  providers: [AdditionalProgramService],
})
export class AdditionalProgramModule {}
