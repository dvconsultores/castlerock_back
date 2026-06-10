import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { StudentTransitionEntity } from '../entities/student-transition.entity';
import { CreateStudentDto, FindStudentDtoQuery, UpdateStudentDto } from '../dto/student.dto';
import { CreateStudentTransitionDto } from '../dto/student-transition.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { ContactPersonEntity } from '../entities/contact-person.entity';
import { StorageService } from '../../../shared/storage/storage.service';
import { Multer } from 'multer';
import { AdditionalProgramService } from '../../additional-program/services/additional-program.service';
import { ClassService } from '../../class/services/class.service';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { DailyScheduleEntity } from '../../daily-schedule/entities/daily-schedule.entity';
import { ClassType } from '../../../shared/enums/class-type.enum';
import { ClassEntity } from '../../class/entities/class.entity';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';
import { TransitionStatus } from '../../../shared/enums/transition-status.enum';

interface EffectiveEnrollment {
  classes: ClassEntity[];
  daysEnrolled: WeekDayEnum[];
  beforeSchoolDays: WeekDayEnum[];
  afterSchoolDays: WeekDayEnum[];
}

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repository: Repository<StudentEntity>,
    @InjectRepository(ContactPersonEntity)
    private readonly contactPersonRepository: Repository<ContactPersonEntity>,
    @InjectRepository(StudentTransitionEntity)
    private readonly transitionRepository: Repository<StudentTransitionEntity>,
    private readonly storageService: StorageService,
    private readonly additionalProgramService: AdditionalProgramService,
    private readonly classService: ClassService,
    @InjectRepository(DailyScheduleEntity)
    private readonly dailyScheduleRepository: Repository<DailyScheduleEntity>,
  ) {}

  async save(entity: StudentEntity): Promise<StudentEntity> {
    return await this.repository.save(entity);
  }

  // ============================================================
  // CREATE
  // ============================================================
  async create(
    user: AuthUser,
    dto: CreateStudentDto,
    image?: Multer.File,
    imageContactPrimary?: Multer.File,
    imageContactSecondary?: Multer.File,
  ): Promise<any> {
    try {
      if (image) {
        const imageUrl = await this.storageService.upload(image);
        dto.image = imageUrl;
      }

      if (imageContactPrimary) {
        const index = dto.contacts.findIndex((contact) => contact.role === 'PRIMARY');
        if (index !== -1) {
          const uploaded = await this.storageService.upload(imageContactPrimary);
          dto.contacts[index].image = uploaded;
        }
      }

      if (imageContactSecondary) {
        const index = dto.contacts.findIndex((contact) => contact.role === 'SECONDARY');
        if (index !== -1) {
          const uploaded = await this.storageService.upload(imageContactSecondary);
          dto.contacts[index].image = uploaded;
        }
      }

      const additionalPrograms = await this.additionalProgramService.findByIds(dto.additionalProgramIds);
      const classes = await this.classService.findByIds(dto.classIds, user.campusId);

      const { transitions: transitionsDto, classIds, additionalProgramIds, ...rest } = dto as any;

      const newEntity = plainToClass(StudentEntity, {
        ...rest,
        classes,
        additionalPrograms,
      });

      const student = await this.repository.save(newEntity);

      // Crear transiciones pendientes
      if (Array.isArray(transitionsDto) && transitionsDto.length > 0) {
        await this.createTransitionsForStudent(student, transitionsDto, user.campusId);
      }

      // Recargar con transiciones pendientes
      const fullStudent = await this.repository.findOne({
        where: { id: student.id },
        relations: ['classes', 'transitions', 'transitions.classes'],
      });

      if (fullStudent) {
        await this.syncStudentInFutureSchedules(fullStudent);
      }

      return instanceToPlain(fullStudent ?? student);
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  private async createTransitionsForStudent(
    student: StudentEntity,
    transitionsDto: CreateStudentTransitionDto[],
    campusId: number,
  ): Promise<StudentTransitionEntity[]> {
    const saved: StudentTransitionEntity[] = [];
    for (const t of transitionsDto) {
      if (!t.startDate || !Array.isArray(t.classIds) || t.classIds.length === 0) {
        continue;
      }
      const classes = await this.classService.findByIds(t.classIds, campusId);
      const entity = this.transitionRepository.create({
        student: { id: student.id } as StudentEntity,
        startDate: t.startDate,
        daysEnrolled: t.daysEnrolled ?? [],
        beforeSchoolDays: t.beforeSchoolDays ?? [],
        afterSchoolDays: t.afterSchoolDays ?? [],
        classes,
        status: TransitionStatus.PENDING,
        completedAt: null,
      });
      saved.push(await this.transitionRepository.save(entity));
    }
    return saved;
  }

  // ============================================================
  // UPDATE
  // ============================================================
  async update(
    user: AuthUser,
    id: number,
    updateData: UpdateStudentDto,
    image?: Multer.File,
    imageContactPrimary?: Multer.File,
    imageContactSecondary?: Multer.File,
  ): Promise<void> {
    try {
      const student = await this.repository.findOne({
        where: { id },
        relations: ['classes', 'transitions', 'transitions.classes'],
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      if (image) {
        updateData.image = await this.storageService.upload(image);
      }

      if (updateData.endDateOfClasses === null) {
        updateData.endDateOfClasses = null as any;
      }

      const { contacts, additionalProgramIds, transitions: transitionsDto, classIds, ...rest } = updateData as any;
      Object.assign(student, rest);

      if (contacts) {
        const rolesInPayload = contacts.map((c: any) => c.role);

        await this.contactPersonRepository.delete({
          student: { id },
          role: Not(In(rolesInPayload)),
        });

        for (const contactData of contacts) {
          const { role } = contactData;

          if (role === 'PRIMARY' && imageContactPrimary) {
            contactData.image = await this.storageService.upload(imageContactPrimary);
          } else if (role === 'SECONDARY' && imageContactSecondary) {
            contactData.image = await this.storageService.upload(imageContactSecondary);
          }

          const existingContact = await this.contactPersonRepository.findOne({
            where: { student: { id }, role },
          });

          if (existingContact) {
            Object.assign(existingContact, { ...contactData, student: { id } });
            await this.contactPersonRepository.save(existingContact);
          } else {
            const newContact = plainToClass(ContactPersonEntity, { ...contactData, student: { id } });
            await this.contactPersonRepository.save(newContact);
          }
        }
      }

      if (additionalProgramIds !== undefined) {
        student.additionalPrograms = await this.additionalProgramService.findByIds(additionalProgramIds);
      }

      if (classIds !== undefined) {
        student.classes = await this.classService.findByIds(classIds, user.campusId);
      }

      // ---- Transiciones ----
      // Si vienen transitions en el payload, reemplazamos todas las PENDING.
      // Las COMPLETED se conservan como histórico.
      if (transitionsDto !== undefined) {
        await this.transitionRepository.delete({
          student: { id },
          status: TransitionStatus.PENDING,
        });

        // Conservar solo las COMPLETED en el array para evitar que cascade las orphane
        const completedTransitions = (student.transitions ?? []).filter((t) => t.status !== TransitionStatus.PENDING);

        if (Array.isArray(transitionsDto) && transitionsDto.length > 0) {
          const newTransitions = await this.createTransitionsForStudent(student, transitionsDto, user.campusId);
          student.transitions = [...completedTransitions, ...newTransitions];
        } else {
          student.transitions = completedTransitions;
        }
      }

      if (!student.campus) {
        student.campus = null as any;
      }

      await this.repository.save(student);

      // Recargar y sincronizar
      const fullStudent = await this.repository.findOne({
        where: { id },
        relations: ['classes', 'transitions', 'transitions.classes'],
      });

      if (fullStudent) {
        await this.syncStudentInFutureSchedules(fullStudent);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      throw new ExceptionHandler(error);
    }
  }

  // ============================================================
  // FIND
  // ============================================================
  async findByParams(user: AuthUser, query: FindStudentDtoQuery): Promise<any[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .leftJoinAndSelect('student.contacts', 'contacts')
      .leftJoinAndSelect('student.additionalPrograms', 'additionalPrograms')
      .leftJoinAndSelect('student.classes', 'classes')
      .leftJoinAndSelect('classes.campus', 'classCampus')
      .leftJoinAndSelect('student.transitions', 'transitions', 'transitions.status = :pendingStatus', {
        pendingStatus: TransitionStatus.PENDING,
      })
      .leftJoinAndSelect('transitions.classes', 'transitionClasses')
      .leftJoinAndSelect('transitionClasses.campus', 'transitionClassesCampus')
      .select([
        'student',
        'campus.id',
        'campus.name',
        'contacts',
        'additionalPrograms',
        'classes',
        'classCampus.id',
        'classCampus.name',
        'transitions',
        'transitionClasses',
        'transitionClassesCampus.id',
        'transitionClassesCampus.name',
      ]);

    if (user.campusId) {
      queryBuilder.where('campus.id = :campusId', { campusId: user.campusId });
    }

    if (query.dayEnrolled) {
      queryBuilder.andWhere('student.daysEnrolled LIKE :pattern', {
        pattern: `%${query.dayEnrolled}%`,
      });
    }

    if (query.endDateOrder) {
      queryBuilder.andWhere('student.endDateOfClasses IS NOT NULL');
      queryBuilder.addOrderBy('student.endDateOfClasses', query.endDateOrder);
    }

    if (query.transitionStartOrder) {
      queryBuilder.addOrderBy('transitions.startDate', query.transitionStartOrder);
    }

    const students = await queryBuilder.getMany();
    return students.map((student) => instanceToPlain(student));
  }

  async findOne(user: AuthUser, id: number): Promise<any> {
    const student = await this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .leftJoinAndSelect('student.contacts', 'contacts')
      .leftJoinAndSelect('student.additionalPrograms', 'additionalPrograms')
      .leftJoinAndSelect('student.classes', 'classes')
      .leftJoinAndSelect('classes.campus', 'classCampus')
      .leftJoinAndSelect('student.transitions', 'transitions', 'transitions.status = :pendingStatus', {
        pendingStatus: TransitionStatus.PENDING,
      })
      .leftJoinAndSelect('transitions.classes', 'transitionClasses')
      .leftJoinAndSelect('transitionClasses.campus', 'transitionClassesCampus')
      .select([
        'student',
        'campus.id',
        'campus.name',
        'contacts',
        'additionalPrograms',
        'classes',
        'classCampus.id',
        'classCampus.name',
        'transitions',
        'transitionClasses',
        'transitionClassesCampus.id',
        'transitionClassesCampus.name',
      ])
      .where('student.id = :id', { id })
      .andWhere('campus.id = :campusId', { campusId: user.campusId })
      .orderBy('transitions.startDate', 'ASC')
      .getOne();

    return student ? instanceToPlain(student) : null;
  }

  async findOneWithRelations(id: number, relations: string[]): Promise<any> {
    const student = await this.repository.findOne({
      where: { id },
      relations,
    });

    return student ? instanceToPlain(student) : null;
  }

  async remove(user: AuthUser, id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id, campus: { id: user.campusId } });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Student not found');
    }
  }

  async findByIds(ids: number[], campusId: number): Promise<StudentEntity[]> {
    if (!ids || ids.length === 0) return [];
    const students = await this.repository.find({
      where: { id: In(ids), campus: { id: campusId } },
      relations: ['classes', 'transitions', 'transitions.classes'],
    });

    return students;
  }

  async findByClassIdAndDayEnrolled(classId: number, day: WeekDayEnum, classType: ClassType): Promise<StudentEntity[]> {
    let column: string;

    switch (classType) {
      case ClassType.AFTER_SCHOOL:
        column = 'student.after_school_days';
        break;
      case ClassType.BEFORE_SCHOOL:
        column = 'student.before_school_days';
        break;
      case ClassType.ENROLLED:
      default:
        column = 'student.days_enrolled';
        break;
    }

    const students = await this.repository
      .createQueryBuilder('student')
      .innerJoin('student.classes', 'class', 'class.id = :classId', { classId })
      .andWhere(`:day = ANY(string_to_array(${column}, ','))`, { day })
      .getMany();

    return students;
  }

  /**
   * Devuelve los estudiantes con transiciones PENDIENTES cuya clase destino,
   * tipo de clase y día coincidan con los parámetros recibidos.
   */
  async findByClassIdAndDayEnrolledTransition(
    classId: number,
    day: WeekDayEnum,
    classType: ClassType,
  ): Promise<StudentEntity[]> {
    let column: string;
    switch (classType) {
      case ClassType.AFTER_SCHOOL:
        column = 'transition.after_school_days';
        break;
      case ClassType.BEFORE_SCHOOL:
        column = 'transition.before_school_days';
        break;
      case ClassType.ENROLLED:
      default:
        column = 'transition.days_enrolled';
        break;
    }

    const students = await this.repository
      .createQueryBuilder('student')
      .innerJoin('student.transitions', 'transition', 'transition.status = :pendingStatus', {
        pendingStatus: TransitionStatus.PENDING,
      })
      .innerJoin('transition.classes', 'transitionClass', 'transitionClass.id = :classId', { classId })
      .andWhere(`:day = ANY(string_to_array(${column}, ','))`, { day })
      .getMany();

    return students;
  }

  async findByFilter(filter: any): Promise<StudentEntity[]> {
    const students = await this.repository.findBy(filter);
    return students;
  }

  // ============================================================
  // HELPERS DE TRANSICIONES
  // ============================================================
  /**
   * Calcula la inscripción efectiva del estudiante a una fecha dada.
   * - Si hay alguna transición PENDIENTE con startDate <= date, gana la de
   *   mayor startDate (la más reciente que ya empezó).
   * - Si no, se usa la información base del estudiante.
   *
   * Requiere que `student.transitions` y `student.classes` estén cargados.
   */
  getEffectiveEnrollmentForDate(student: StudentEntity, date: Date | string): EffectiveEnrollment {
    const target = this.normalizeDate(date);

    const pendingActive = (student.transitions ?? [])
      .filter((t) => t.status === TransitionStatus.PENDING)
      .filter((t) => {
        const start = this.normalizeDate(t.startDate);
        return start !== null && target !== null && start.getTime() <= target.getTime();
      })
      .sort((a, b) => this.normalizeDate(b.startDate)!.getTime() - this.normalizeDate(a.startDate)!.getTime());

    if (pendingActive.length > 0) {
      const winner = pendingActive[0];
      return {
        classes: winner.classes ?? [],
        daysEnrolled: winner.daysEnrolled ?? [],
        beforeSchoolDays: winner.beforeSchoolDays ?? [],
        afterSchoolDays: winner.afterSchoolDays ?? [],
      };
    }

    return {
      classes: student.classes ?? [],
      daysEnrolled: student.daysEnrolled ?? [],
      beforeSchoolDays: student.beforeSchoolDays ?? [],
      afterSchoolDays: student.afterSchoolDays ?? [],
    };
  }

  /**
   * Determina si un estudiante debe estar en un daily schedule específico,
   * según su inscripción efectiva a la fecha del schedule.
   */
  shouldBeInDailySchedule(
    student: StudentEntity,
    schedDate: Date | string,
    day: WeekDayEnum,
    classId: number,
    classType: ClassType,
  ): boolean {
    const target = this.normalizeDate(schedDate);
    if (!target) return false;

    if (student.startDateOfClasses) {
      const sd = this.normalizeDate(student.startDateOfClasses)!;
      if (target.getTime() < sd.getTime()) return false;
    }

    if (student.endDateOfClasses) {
      const ed = this.normalizeDate(student.endDateOfClasses)!;
      if (target.getTime() > ed.getTime()) return false;
    }

    const effective = this.getEffectiveEnrollmentForDate(student, target);
    if (!effective.classes.some((c) => c.id === classId)) return false;

    const dayList =
      classType === ClassType.AFTER_SCHOOL
        ? effective.afterSchoolDays
        : classType === ClassType.BEFORE_SCHOOL
          ? effective.beforeSchoolDays
          : effective.daysEnrolled;

    if (!dayList || !dayList.includes(day)) return false;

    return true;
  }

  /**
   * Reconcilia la presencia del estudiante en todos los daily schedules
   * futuros (>= hoy) de las clases con las que tiene relación (base o
   * transiciones), agregándolo o quitándolo según corresponda.
   */
  async syncStudentInFutureSchedules(student: StudentEntity): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const relevantClassIds = new Set<number>();
    (student.classes ?? []).forEach((c) => relevantClassIds.add(c.id));
    (student.transitions ?? [])
      .filter((t) => t.status === TransitionStatus.PENDING)
      .forEach((t) => (t.classes ?? []).forEach((c) => relevantClassIds.add(c.id)));

    if (relevantClassIds.size === 0) {
      // Aun así puede que esté inscrito en daily schedules huérfanos: limpiar.
      // Usamos INNER JOIN con el estudiante para encontrar solo los schedules
      // donde sigue listado, y la relation API para eliminar directamente
      // del join table.
      const orphanSchedules = await this.dailyScheduleRepository
        .createQueryBuilder('ds')
        .innerJoin('ds.students', 'stu', 'stu.id = :studentId', { studentId: student.id })
        .innerJoin('ds.planning', 'planning')
        .where('ds.date >= :today', { today })
        .select('ds.id')
        .getMany();

      await Promise.all(
        orphanSchedules.map((s) =>
          this.dailyScheduleRepository
            .createQueryBuilder()
            .relation(DailyScheduleEntity, 'students')
            .of(s.id)
            .remove(student.id),
        ),
      );
      return;
    }

    const classIdsArray = Array.from(relevantClassIds);

    // 1. Schedules de clases relevantes: reconciliar add/remove
    const futureSchedules = await this.dailyScheduleRepository
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.students', 'students')
      .leftJoinAndSelect('ds.planning', 'planning')
      .leftJoinAndSelect('planning.class', 'class')
      .where('ds.date >= :today', { today })
      .andWhere('class.id IN (:...classIds)', { classIds: classIdsArray })
      .getMany();

    const ops: Promise<any>[] = [];

    for (const sched of futureSchedules) {
      if (!sched.planning || !sched.planning.class) continue;

      const classId = sched.planning.class.id;
      const classType = sched.planning.class.classType;
      const shouldBe = this.shouldBeInDailySchedule(student, sched.date, sched.day, classId, classType);
      const isIn = (sched.students ?? []).some((s) => s.id === student.id);

      if (shouldBe && !isIn) {
        // Usar relation API para agregar directamente al join table
        ops.push(
          this.dailyScheduleRepository
            .createQueryBuilder()
            .relation(DailyScheduleEntity, 'students')
            .of(sched.id)
            .add(student.id),
        );
      } else if (!shouldBe && isIn) {
        // Usar relation API para eliminar directamente del join table
        ops.push(
          this.dailyScheduleRepository
            .createQueryBuilder()
            .relation(DailyScheduleEntity, 'students')
            .of(sched.id)
            .remove(student.id),
        );
      }
    }

    // 2. Remover al estudiante de daily schedules de clases que ya no son
    //    relevantes (e.g., clase de transición eliminada).
    //    Usamos INNER JOIN con el estudiante para encontrar solo los schedules
    //    donde sigue listado, y la relation API para eliminar directamente
    //    del join table sin depender de save().
    const staleSchedules = await this.dailyScheduleRepository
      .createQueryBuilder('ds')
      .innerJoin('ds.students', 'stu', 'stu.id = :studentId', { studentId: student.id })
      .innerJoin('ds.planning', 'planning')
      .innerJoin('planning.class', 'class')
      .where('ds.date >= :today', { today })
      .andWhere('class.id NOT IN (:...classIds)', { classIds: classIdsArray })
      .select('ds.id')
      .getMany();

    for (const sched of staleSchedules) {
      ops.push(
        this.dailyScheduleRepository
          .createQueryBuilder()
          .relation(DailyScheduleEntity, 'students')
          .of(sched.id)
          .remove(student.id),
      );
    }

    await Promise.all(ops);
  }

  private normalizeDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;
    const d = new Date(date as any);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}
