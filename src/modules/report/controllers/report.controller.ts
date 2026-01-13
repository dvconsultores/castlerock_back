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
  Res,
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
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateReportDto, @Res() res: any) {
    if (body.pdf) {
      const pdfBuffer = await this.reportService.createPdf(body);

      const filename = `reporte-clase-${body.classId}-${body.startDate}-a-${body.endDate}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.send(pdfBuffer);
    }

    return res.json(await this.reportService.create(body));
  }
}
