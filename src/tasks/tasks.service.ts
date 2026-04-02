import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentEntity } from '../modules/student/entities/student.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
  ) {}

  // @Cron('0 */30 * * * *')
  async transitionStudentsToActive() {
    this.logger.log('⏰ Ejecutando tarea de transición de estudiantes...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const studentsToTransition = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.classesTransition', 'classesTransition')
        .where('student.startDateOfClassesTransition = :today', { today })
        .getMany();

      if (!studentsToTransition.length) {
        this.logger.log('No hay estudiantes para transición hoy.');
        return;
      }

      this.logger.log(`Encontrados ${studentsToTransition.length} estudiantes para transición.`);

      for (const student of studentsToTransition) {
        student.startDateOfClasses = student.startDateOfClassesTransition;
        student.daysEnrolled = student.daysEnrolledTransition || [];
        student.beforeSchoolDays = student.beforeSchoolDaysTransition || [];
        student.afterSchoolDays = student.afterSchoolDaysTransition || [];
        student.classes = student.classesTransition || [];

        student.startDateOfClassesTransition = null;
        (student as any).daysEnrolledTransition = null;
        (student as any).beforeSchoolDaysTransition = null;
        (student as any).afterSchoolDaysTransition = null;
        student.classesTransition = [];

        await this.studentRepository.save(student);

        this.logger.log(
          `✅ Estudiante ${student.firstName} ${student.lastName} (${student.id}) actualizado correctamente.`,
        );
      }

      this.logger.log('🎉 Transición completada correctamente.');
    } catch (error) {
      this.logger.error('❌ Error en la tarea de transición de estudiantes:', error);
    }
  }
}
