import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClassEntity } from '../entities/class.entity';
import { ClassDto, CreateClassDto, UpdateClassDto } from '../dto/class.dto';
import { plainToClass } from 'class-transformer';
import { StorageService } from '../../../shared/storage/storage.service';
import { Multer } from 'multer';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { StudentEntity } from '../../student/entities/student.entity';
import { TransitionStatus } from '../../../shared/enums/transition-status.enum';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly repository: Repository<ClassEntity>,
    private readonly storageService: StorageService,
  ) {}

  async save(entity: ClassEntity): Promise<ClassEntity> {
    return await this.repository.save(entity);
  }

  async create(user: AuthUser, dto: ClassDto, image?: Multer.File): Promise<ClassEntity> {
    let imageUrl: string | null = null;

    if (image) {
      imageUrl = await this.storageService.upload(image);
      dto.image = imageUrl;
    }

    const newEntity = plainToClass(ClassEntity, dto);

    return await this.repository.save(newEntity);
  }

  async findAll(campusId?: number): Promise<ClassEntity[]> {
    const today = this.normalizeDate(new Date())!;

    const classes = await this.repository.find({
      where: campusId ? { campus: { id: campusId } } : {},
      relations: ['campus', 'students', 'students.transitions', 'students.transitions.classes', 'teachers'],
    });

    for (const cls of classes) {
      cls.students = (cls.students ?? []).filter((s) => this.isStudentCurrentlyInClass(s, cls.id, today));
    }

    return classes;
  }

  async findOne(user: AuthUser, id: number): Promise<ClassEntity | null> {
    const today = this.normalizeDate(new Date())!;

    const cls = await this.repository.findOne({
      where: { id, campus: { id: user.campusId } },
      relations: ['campus', 'students', 'students.transitions', 'students.transitions.classes', 'teachers'],
    });

    if (cls) {
      cls.students = (cls.students ?? []).filter((s) => this.isStudentCurrentlyInClass(s, cls.id, today));
    }

    return cls;
  }

  /**
   * Normaliza una fecha a medianoche (solo año/mes/día).
   */
  private normalizeDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;
    const d = new Date(date as any);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /**
   * Determina si un estudiante está efectivamente inscrito en la clase a la fecha dada.
   * Replica la lógica de StudentService.getEffectiveEnrollmentForDate / shouldBeInDailySchedule:
   *  - Respeta startDateOfClasses / endDateOfClasses.
   *  - Si existe una transición PENDIENTE cuyo startDate ya llegó, esa transición redefine
   *    a qué clase pertenece el estudiante (gana sobre la asignación base del join).
   *  - Si no hay transición activa, la asignación base (estar en el join de esta clase)
   *    sigue vigente y el estudiante pertenece a la clase.
   * 
   */
  private isStudentCurrentlyInClass(student: StudentEntity, classId: number, today: Date): boolean {
    // 1) Límites de fechas base de la inscripción
    if (student.startDateOfClasses) {
      const start = this.normalizeDate(student.startDateOfClasses);
      if (start && today.getTime() < start.getTime()) return false;
    }
    if (student.endDateOfClasses) {
      const end = this.normalizeDate(student.endDateOfClasses);
      if (end && today.getTime() > end.getTime()) return false;
    }

    // 2) Transiciones PENDIENTES ya activas: la más reciente redefine la clase efectiva
    const activeTransitions = (student.transitions ?? [])
      .filter((t) => t.status === TransitionStatus.PENDING)
      .map((t) => ({ transition: t, start: this.normalizeDate(t.startDate) }))
      .filter((x) => x.start !== null && x.start.getTime() <= today.getTime())
      .sort((a, b) => b.start!.getTime() - a.start!.getTime());

    if (activeTransitions.length > 0) {
      // La transición activa reasigna al estudiante: solo pertenece a la clase destino.
      return (activeTransitions[0].transition.classes ?? []).some((c) => c.id === classId);
    }

    // 3) Sin transición activa: la asignación base (join con esta clase) sigue vigente.
    return true;
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<ClassEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: relations,
    });
  }

  async update(user: AuthUser, id: number, updateData: UpdateClassDto, image?: Multer.File): Promise<void> {
    let imageUrl: string | undefined;

    if (image) {
      imageUrl = await this.storageService.upload(image);
      updateData.image = imageUrl;
    }

    const updateResult = await this.repository.update(
      { id, campus: { id: user.campusId } },
      plainToClass(ClassEntity, updateData),
    );
    if (updateResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async remove(user: AuthUser, id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id, campus: { id: user.campusId } });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async findByIds(ids: number[], campusId: number): Promise<ClassEntity[]> {
    return await this.repository.findBy({ id: In(ids), campus: { id: campusId } });
  }
}
