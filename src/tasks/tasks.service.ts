import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { StudentEntity } from '../modules/student/entities/student.entity';
import { StudentTransitionEntity } from '../modules/student/entities/student-transition.entity';
import { TransitionStatus } from '../shared/enums/transition-status.enum';
import { StudentService } from '../modules/student/services/student.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
    @InjectRepository(StudentTransitionEntity)
    private readonly transitionRepository: Repository<StudentTransitionEntity>,
    private readonly studentService: StudentService,
  ) {}

  @Cron('0 */30 * * * *')
  async transitionStudentsToActive() {
    this.logger.log('⏰ Ejecutando tarea de transición de estudiantes...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Tomamos todas las transiciones PENDIENTES cuyo startDate ya llegó
      // (<= hoy) por si alguna quedó pendiente de ejecuciones previas.
      const pendingTransitions = await this.transitionRepository.find({
        where: {
          status: TransitionStatus.PENDING,
          startDate: LessThanOrEqual(today as any),
        },
        relations: ['student', 'classes'],
        order: { startDate: 'ASC' },
      });

      if (!pendingTransitions.length) {
        this.logger.log('No hay transiciones para aplicar hoy.');
        return;
      }

      // Agrupar por estudiante para aplicar en orden cronológico.
      const byStudent = new Map<number, StudentTransitionEntity[]>();
      for (const t of pendingTransitions) {
        if (!t.student) continue;
        const list = byStudent.get(t.student.id) ?? [];
        list.push(t);
        byStudent.set(t.student.id, list);
      }

      this.logger.log(`Encontrados ${byStudent.size} estudiante(s) con transiciones a aplicar.`);

      for (const [studentId, transitions] of byStudent.entries()) {
        const student = await this.studentRepository.findOne({
          where: { id: studentId },
          relations: ['classes'],
        });

        if (!student) {
          this.logger.warn(`Estudiante ${studentId} no encontrado, saltando.`);
          continue;
        }

        // Aplicar cada transición en orden; la última gana sobre los campos base.
        for (const t of transitions) {
          student.startDateOfClasses = t.startDate as any;
          student.daysEnrolled = t.daysEnrolled ?? [];
          student.beforeSchoolDays = t.beforeSchoolDays ?? [];
          student.afterSchoolDays = t.afterSchoolDays ?? [];
          student.classes = t.classes ?? [];

          t.status = TransitionStatus.COMPLETED;
          t.completedAt = new Date();
        }

        await this.studentRepository.save(student);
        await this.transitionRepository.save(transitions);

        this.logger.log(
          `✅ Estudiante ${student.firstName} ${student.lastName} (${student.id}) actualizado con ${transitions.length} transición(es).`,
        );
      }

      this.logger.log('🎉 Transiciones aplicadas correctamente.');
    } catch (error) {
      this.logger.error('❌ Error en la tarea de transición de estudiantes:', error);
    }
  }
}
