import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit'; // <--- Importamos PDFKit
import { StudentEntity } from '../../student/entities/student.entity';
import { CreateReportDto } from '../dto/report.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
  ) {}

  // --- TU MÉTODO DE CÁLCULO (Sin cambios) ---
  async create(dto: CreateReportDto) {
    const rangeStart = this.startOfDay(new Date(dto.startDate));
    const rangeEnd = this.endOfDay(new Date(dto.endDate));

    const students = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.classes', 'class', 'class.id = :classId', { classId: dto.classId })
      .where(
        `
        (student.startDateOfClasses IS NULL OR student.startDateOfClasses <= :rangeEnd)
        AND
        (student.endDateOfClasses IS NULL OR student.endDateOfClasses >= :rangeStart)
        `,
        { rangeStart, rangeEnd },
      )
      .getMany();

    return this.calculateTotals(students, rangeStart, rangeEnd);
  }

  // --- NUEVO MÉTODO PARA GENERAR PDF (EN INGLÉS) ---
  async createPdf(dto: CreateReportDto): Promise<Buffer> {
    // 1. Obtenemos los datos calculados
    const data = await this.create(dto);

    // 2. Creamos una promesa para generar el buffer
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // --- PDF HEADER ---
      doc.fontSize(18).text('Class Report', { align: 'center' });
      doc.moveDown();

      // General Info
      doc.fontSize(10);
      // Forzamos formato de fecha en inglés (en-US)
      const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const generatedDate = new Date().toLocaleDateString('en-US', dateOptions);

      doc.text(`Generated on: ${generatedDate}`, { align: 'right' });

      const startStr = new Date(data.range.startDate).toLocaleDateString('en-US', dateOptions);
      const endStr = new Date(data.range.endDate).toLocaleDateString('en-US', dateOptions);

      doc.fontSize(12).font('Helvetica-Bold').text('Period Summary');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Range: ${startStr} - ${endStr}`);
      doc.text(`Total Students: ${data.studentsCount}`);
      doc.moveDown(0.5);

      // Monetary Totals
      doc.text(`Calculated Weekly Total: $${data.totalWeekly.toFixed(2)}`);
      doc.text(`Calculated Monthly Total: $${data.totalMonthly.toFixed(2)}`);
      doc.moveDown(2);

      // --- STUDENTS TABLE ---
      // Definimos posiciones X
      const colNameX = 50;
      const colDaysX = 280;
      const colWeeklyX = 350;
      const colMonthlyX = 450;
      const colWidth = 200;

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);

      doc.text('Student Name', colNameX, tableTop);
      doc.text('Active Days', colDaysX, tableTop);
      doc.text('Weekly ($)', colWeeklyX, tableTop);
      doc.text('Monthly ($)', colMonthlyX, tableTop);

      // Separator Line
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();
      doc.moveDown();

      let currentY = doc.y + 10;

      // Iterate details
      doc.font('Helvetica').fontSize(9);

      data.details.forEach((student) => {
        // Page break check
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
          // Optional: You can repeat headers here if needed
        }

        doc.text(student.studentName, colNameX, currentY, { width: colWidth, ellipsis: true });
        doc.text(student.activeDays.toString(), colDaysX, currentY);
        doc.text(`$${student.calculatedWeekly.toFixed(2)}`, colWeeklyX, currentY);
        doc.text(`$${student.calculatedMonthly.toFixed(2)}`, colMonthlyX, currentY);

        currentY += 20; // Row spacing
      });

      doc.end();
    });
  }

  // ... (Tus métodos privados calculateTotals, getActiveWindow, etc. siguen igual) ...

  private calculateTotals(students: StudentEntity[], rangeStart: Date, rangeEnd: Date) {
    // ... tu código existente ...
    // (Incluyo el inicio para contexto, no es necesario cambiar nada abajo)
    let totalWeekly = 0;
    let totalMonthly = 0;
    const totalDays = this.diffDaysInclusive(rangeStart, rangeEnd);

    const details = students.map((student) => {
      // ... tu logica ...
      // Simplemente asegúrate de que retorna lo que espera el createPdf
      const { activeFrom, activeTo, activeDays } = this.getActiveWindow(student, rangeStart, rangeEnd);
      const weeklyBase = Number(student.weeklyAmount || 0);
      const monthlyBase = Number(student.monthlyAmount || 0);
      const weekly = totalDays > 0 ? (activeDays / totalDays) * weeklyBase : 0;
      const monthly = totalDays > 0 ? (activeDays / totalDays) * monthlyBase : 0;
      totalWeekly += weekly;
      totalMonthly += monthly;

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        activeDays,
        totalDays,
        weeklyAmount: weeklyBase,
        monthlyAmount: monthlyBase,
        calculatedWeekly: Number(weekly.toFixed(2)),
        calculatedMonthly: Number(monthly.toFixed(2)),
        activeFrom,
        activeTo,
        debug: {
          studentStartDateOfClasses: student.startDateOfClasses ?? null,
          studentEndDateOfClasses: student.endDateOfClasses ?? null,
        },
      };
    });

    return {
      range: { startDate: rangeStart, endDate: rangeEnd },
      studentsCount: students.length,
      totalWeekly: Number(totalWeekly.toFixed(2)),
      totalMonthly: Number(totalMonthly.toFixed(2)),
      details,
    };
  }

  private getActiveWindow(student: StudentEntity, rangeStart: Date, rangeEnd: Date) {
    const realStart = student.startDateOfClasses ? this.startOfDay(student.startDateOfClasses) : null;
    const realEnd = student.endDateOfClasses ? this.endOfDay(student.endDateOfClasses) : null;
    const activeFrom = realStart && realStart > rangeStart ? realStart : rangeStart;
    const activeTo = realEnd && realEnd < rangeEnd ? realEnd : rangeEnd;
    const activeDays = this.diffDaysInclusive(activeFrom, activeTo);
    return { activeFrom, activeTo, activeDays };
  }

  private diffDaysInclusive(start: Date, end: Date): number {
    const s = this.utcMidnight(start);
    const e = this.utcMidnight(end);
    if (e < s) return 0;
    return Math.floor((e - s) / 86400000) + 1;
  }

  private utcMidnight(d: Date): number {
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private endOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }
}
