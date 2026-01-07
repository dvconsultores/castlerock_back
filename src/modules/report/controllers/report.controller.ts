import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateReportDto } from '../dto/report.dto';
import { ReportService } from '../services/report.service';
import { AuthGuard } from '../../../helpers/guards/auth.guard';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { Roles } from '../../../helpers/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  // @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateReportDto) {
    return this.reportService.create(body);
  }
}
