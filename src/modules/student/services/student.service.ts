import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { CreateStudentDto, FindStudentDtoQuery, UpdateStudentDto } from '../dto/student.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ExceptionHandler } from '../../../helpers/handlers/exception.handler';
import { ContactPersonEntity } from '../entities/contact-person.entity';
import { StorageService } from '../../../shared/storage/storage.service';
import { Multer } from 'multer';
import { AdditionalProgramService } from '../../additional-program/services/additional-program.service';
import { ProgramType } from '../../../shared/enums/program-type.enum';
import { ClassService } from '../../class/services/class.service';
import { WeekDayEnum } from '../../../shared/enums/week-day.enum';
import { DailyScheduleEntity } from '../../daily-schedule/entities/daily-schedule.entity';
import { ClassType } from '../../../shared/enums/class-type.enum';
import { ClassEntity } from '../../class/entities/class.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repository: Repository<StudentEntity>,
    @InjectRepository(ContactPersonEntity)
    private readonly contactPersonRepository: Repository<ContactPersonEntity>,
    private readonly storageService: StorageService,
    private readonly additionalProgramService: AdditionalProgramService,
    private readonly classService: ClassService,
    @InjectRepository(DailyScheduleEntity)
    private readonly dailyScheduleRepository: Repository<DailyScheduleEntity>,
  ) {}

  async save(entity: StudentEntity): Promise<StudentEntity> {
    return await this.repository.save(entity);
  }

  async create(
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

      const classes = await this.classService.findByIds(dto.classIds);

      const classesTransition = await this.classService.findByIds(dto.classIdsTransition);

      const newEntity = plainToClass(StudentEntity, {
        ...dto,
        classes,
        additionalPrograms,
        classesTransition,
      });

      const student = await this.repository.save(newEntity);

      const studentId = student.id;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startFrom = student.startDateOfClasses
        ? new Date(new Date(student.startDateOfClasses as any).setHours(0, 0, 0, 0))
        : today;

      const buildDateCondition = (baseDays: string[]) => ({
        date: MoreThanOrEqual(startFrom),
        day: In(baseDays),
      });

      // -------------------- ENROLLED --------------------
      const whereEnrolled: any = {
        planning: {
          class: {
            id: In(classes.map((c) => c.id)),
            classType: ClassType.ENROLLED,
          },
        },
        ...buildDateCondition(dto.daysEnrolled),
      };

      const futureSchedulesEnrolled = await this.dailyScheduleRepository.find({
        where: whereEnrolled,
        relations: ['students'],
      });

      const savePromisesEnrolled = futureSchedulesEnrolled
        .filter((sched) => {
          // No está inscrito y la fecha no supera su endDateOfClasses
          return !sched.students.some((t) => t.id === studentId) && !this.isOutsideActiveRange(student, sched.date);
        })
        .map((sched) => {
          sched.students.push(student);
          return this.dailyScheduleRepository.save(sched);
        });

      await Promise.all(savePromisesEnrolled);

      // -------------------- AFTER SCHOOL --------------------
      if (dto.afterSchoolDays) {
        const whereAfterSchool: any = {
          planning: {
            class: {
              id: In(classes.map((c) => c.id)),
              classType: ClassType.AFTER_SCHOOL,
            },
          },
          ...buildDateCondition(dto.afterSchoolDays),
        };

        const futureSchedulesAfterSchool = await this.dailyScheduleRepository.find({
          where: whereAfterSchool,
          relations: ['students'],
        });

        const savePromisesAfterSchool = futureSchedulesAfterSchool
          .filter((sched) => {
            return !sched.students.some((t) => t.id === studentId) && !this.isOutsideActiveRange(student, sched.date);
          })
          .map((sched) => {
            sched.students.push(student);
            return this.dailyScheduleRepository.save(sched);
          });

        await Promise.all(savePromisesAfterSchool);
      }

      // -------------------- BEFORE SCHOOL --------------------
      if (dto.beforeSchoolDays) {
        const whereBeforeSchool: any = {
          planning: {
            class: {
              id: In(classes.map((c) => c.id)),
              classType: ClassType.BEFORE_SCHOOL,
            },
          },
          ...buildDateCondition(dto.beforeSchoolDays),
        };

        const futureSchedulesBeforeSchool = await this.dailyScheduleRepository.find({
          where: whereBeforeSchool,
          relations: ['students'],
        });

        const savePromisesBeforeSchool = futureSchedulesBeforeSchool
          .filter((sched) => {
            return !sched.students.some((t) => t.id === studentId) && !this.isOutsideActiveRange(student, sched.date);
          })
          .map((sched) => {
            sched.students.push(student);
            return this.dailyScheduleRepository.save(sched);
          });

        await Promise.all(savePromisesBeforeSchool);
      }

      await this.handleStudentScheduleTransition(student);

      return instanceToPlain(student);
    } catch (error) {
      throw new ExceptionHandler(error);
    }
  }

  async handleStudentScheduleTransition(student: StudentEntity): Promise<void> {
    if (!student.startDateOfClassesTransition || !student.daysEnrolledTransition) {
      return;
    }

    const startFrom = new Date(new Date(student.startDateOfClassesTransition).setHours(0, 0, 0, 0));

    // -------------------- ENROLLED --------------------
    const whereEnrolled: any = {
      planning: {
        class: {
          id: In(student.classesTransition.map((c) => c.id)),
          classType: ClassType.ENROLLED,
        },
      },
      date: MoreThanOrEqual(startFrom),
      day: In(student.daysEnrolledTransition),
    };

    const futureSchedulesEnrolled = await this.dailyScheduleRepository.find({
      where: whereEnrolled,
      relations: ['students'],
    });

    const savePromisesEnrolled = futureSchedulesEnrolled
      .filter((sched) => {
        return !sched.students.some((t) => t.id === student.id) && !this.isAfterEndDate(student, sched.date);
      })
      .map((sched) => {
        sched.students.push(student);
        return this.dailyScheduleRepository.save(sched);
      });

    await Promise.all(savePromisesEnrolled);

    // -------------------- AFTER SCHOOL --------------------
    if (student.afterSchoolDaysTransition) {
      const whereAfterSchool: any = {
        planning: {
          class: {
            id: In(student.classesTransition.map((c) => c.id)),
            classType: ClassType.AFTER_SCHOOL,
          },
        },
        date: MoreThanOrEqual(startFrom),
        day: In(student.afterSchoolDaysTransition),
      };

      const futureSchedulesAfterSchool = await this.dailyScheduleRepository.find({
        where: whereAfterSchool,
        relations: ['students'],
      });

      const savePromisesAfterSchool = futureSchedulesAfterSchool
        .filter((sched) => {
          return !sched.students.some((t) => t.id === student.id) && !this.isAfterEndDate(student, sched.date);
        })
        .map((sched) => {
          sched.students.push(student);
          return this.dailyScheduleRepository.save(sched);
        });

      await Promise.all(savePromisesAfterSchool);
    }

    // -------------------- BEFORE SCHOOL --------------------
    if (student.beforeSchoolDaysTransition) {
      const whereBeforeSchool: any = {
        planning: {
          class: {
            id: In(student.classesTransition.map((c) => c.id)),
            classType: ClassType.BEFORE_SCHOOL,
          },
        },
        date: MoreThanOrEqual(startFrom),
        day: In(student.beforeSchoolDaysTransition),
      };

      const futureSchedulesBeforeSchool = await this.dailyScheduleRepository.find({
        where: whereBeforeSchool,
        relations: ['students'],
      });

      const savePromisesBeforeSchool = futureSchedulesBeforeSchool
        .filter((sched) => {
          return !sched.students.some((t) => t.id === student.id) && !this.isAfterEndDate(student, sched.date);
        })
        .map((sched) => {
          sched.students.push(student);
          return this.dailyScheduleRepository.save(sched);
        });

      await Promise.all(savePromisesBeforeSchool);
    }
  }

  private isAfterEndDate = (student: StudentEntity, schedDate: Date): boolean => {
    if (!student.endDateOfClasses) return false;
    const endDate = new Date(student.endDateOfClasses as any);
    endDate.setHours(0, 0, 0, 0);
    return schedDate.getTime() > endDate.getTime();
  };

  private isOutsideActiveRange = (student: StudentEntity, schedDate: Date): boolean => {
    const date = new Date(schedDate);
    date.setHours(0, 0, 0, 0);

    if (student.endDateOfClasses) {
      const endDate = new Date(student.endDateOfClasses);
      endDate.setHours(0, 0, 0, 0);
      if (date.getTime() > endDate.getTime()) return true;
    }

    if (student.startDateOfClassesTransition) {
      const startTransition = new Date(student.startDateOfClassesTransition);
      startTransition.setHours(0, 0, 0, 0);
      if (date.getTime() >= startTransition.getTime()) return true;
    }

    return false;
  };

  async findByParams(query: FindStudentDtoQuery): Promise<any[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .leftJoinAndSelect('student.contacts', 'contacts')
      .leftJoinAndSelect('student.additionalPrograms', 'additionalPrograms')
      .leftJoinAndSelect('student.classes', 'classes')
      .leftJoinAndSelect('student.classesTransition', 'classesTransition')
      .leftJoinAndSelect('classes.campus', 'classCampus')
      .select([
        'student',
        'campus.id',
        'campus.name',
        'contacts',
        'additionalPrograms',
        'classes',
        'classesTransition',
        'classCampus.id',
        'classCampus.name',
      ]);

    if (query.campusId) {
      queryBuilder.where('campus.id = :campusId', { campusId: query.campusId });
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
      queryBuilder.andWhere('student.startDateOfClassesTransition IS NOT NULL');
      queryBuilder.addOrderBy('student.startDateOfClassesTransition', query.transitionStartOrder);
    }

    const students = await queryBuilder.getMany();
    return students.map((student) => instanceToPlain(student));
  }

  async findOne(id: number): Promise<any> {
    const student = await this.repository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.campus', 'campus')
      .leftJoinAndSelect('student.contacts', 'contacts')
      .leftJoinAndSelect('student.additionalPrograms', 'additionalPrograms')
      .leftJoinAndSelect('student.classes', 'classes')
      .leftJoinAndSelect('student.classesTransition', 'classesTransition')
      .leftJoinAndSelect('classes.campus', 'classCampus')
      .select([
        'student',
        'campus.id',
        'campus.name',
        'contacts',
        'additionalPrograms',
        'classes',
        'classesTransition',
        'classCampus.id',
        'classCampus.name',
      ])
      .where('student.id = :id', { id })
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

  async update(
    id: number,
    updateData: UpdateStudentDto,
    image?: Multer.File,
    imageContactPrimary?: Multer.File,
    imageContactSecondary?: Multer.File,
  ): Promise<void> {
    try {
      const student = await this.repository.findOne({ where: { id }, relations: ['classes'] });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      let imageUrl: string | undefined;

      if (image) {
        imageUrl = await this.storageService.upload(image);
        updateData.image = imageUrl;
      }

      if (
        updateData.endDateOfClasses === null ||
        updateData.endDateOfClasses === '' ||
        updateData.endDateOfClasses === 'null'
      ) {
        updateData.endDateOfClasses = null as any;
      }

      const classesIds = student.classes || [];
      const classesTransitionIds = student.classesTransition || [];

      const { contacts, additionalProgramIds, ...rest } = updateData;
      Object.assign(student, rest);

      if (contacts) {
        const rolesInPayload = contacts.map((c) => c.role);

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

          let existingContact = await this.contactPersonRepository.findOne({
            where: {
              student: { id },
              role,
            },
          });

          if (existingContact) {
            Object.assign(existingContact, {
              ...contactData,
              student: { id },
            });
            await this.contactPersonRepository.save(existingContact);
          } else {
            const newContact = plainToClass(ContactPersonEntity, {
              ...contactData,
              student: { id },
            });
            await this.contactPersonRepository.save(newContact);
          }
        }
      }

      if (updateData.additionalProgramIds) {
        console.log('Updating additional programs:', updateData.additionalProgramIds);
        const additionalPrograms = await this.additionalProgramService.findByIds(updateData.additionalProgramIds);
        student.additionalPrograms = additionalPrograms;
      }

      console.log('Updating classes:', updateData.classIds, classesIds);
      if ((updateData.classIds !== undefined && updateData.classIds.length >= 0) || classesIds.length > 0) {
        const classes = updateData.classIds ? await this.classService.findByIds(updateData.classIds) : classesIds;

        const removedClasses = student.classes.filter((oldC) => !classes.some((newC) => newC.id === oldC.id));

        const studentId = student.id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startFrom = student.startDateOfClasses
          ? new Date(new Date(student.startDateOfClasses as any).setHours(0, 0, 0, 0))
          : today;

        // El filtro ahora solo depende de startDateOfClasses
        const dateCondition = { date: MoreThanOrEqual(startFrom) };

        const addPromises: Promise<any>[] = [];

        // -------------------- ENROLLED --------------------
        if (Array.isArray(updateData.daysEnrolled)) {
          const whereEnrolled: any = {
            planning: {
              class: {
                id: In(classes.map((c) => c.id)),
                classType: ClassType.ENROLLED,
              },
            },
            ...dateCondition,
          };

          const futureSchedulesEnrolled = await this.dailyScheduleRepository.find({
            where: whereEnrolled,
            relations: ['students'],
          });

          for (const sched of futureSchedulesEnrolled) {
            const isEnrolled = sched.students.some((s) => s.id === studentId);
            const shouldBeEnrolled = student.daysEnrolled.includes(sched.day);
            const shouldBeRemoved = this.isOutsideActiveRange(student, sched.date);

            if (!isEnrolled && shouldBeEnrolled && !shouldBeRemoved) {
              sched.students.push(student);
              addPromises.push(this.dailyScheduleRepository.save(sched));
            } else if (isEnrolled && (!shouldBeEnrolled || shouldBeRemoved)) {
              sched.students = sched.students.filter((s) => s.id !== studentId);
              addPromises.push(this.dailyScheduleRepository.save(sched));
            }
          }
        }

        // -------------------- AFTER SCHOOL --------------------
        if (Array.isArray(updateData.afterSchoolDays)) {
          const whereAfterSchool: any = {
            planning: {
              class: {
                id: In(classes.map((c) => c.id)),
                classType: ClassType.AFTER_SCHOOL,
              },
            },
            ...dateCondition,
          };

          const futureSchedulesAfterSchool = await this.dailyScheduleRepository.find({
            where: whereAfterSchool,
            relations: ['students'],
          });

          for (const sched of futureSchedulesAfterSchool) {
            const isEnrolled = sched.students.some((s) => s.id === studentId);
            const shouldBeEnrolled = student.afterSchoolDays.includes(sched.day);
            const shouldBeRemoved = this.isOutsideActiveRange(student, sched.date);

            if (!isEnrolled && shouldBeEnrolled && !shouldBeRemoved) {
              sched.students.push(student);
              addPromises.push(this.dailyScheduleRepository.save(sched));
            } else if (isEnrolled && (!shouldBeEnrolled || shouldBeRemoved)) {
              sched.students = sched.students.filter((s) => s.id !== studentId);
              addPromises.push(this.dailyScheduleRepository.save(sched));
            }
          }
        }

        // -------------------- BEFORE SCHOOL --------------------
        if (Array.isArray(updateData.beforeSchoolDays)) {
          const whereBeforeSchool: any = {
            planning: {
              class: {
                id: In(classes.map((c) => c.id)),
                classType: ClassType.BEFORE_SCHOOL,
              },
            },
            ...dateCondition,
          };

          const futureSchedulesBeforeSchool = await this.dailyScheduleRepository.find({
            where: whereBeforeSchool,
            relations: ['students'],
          });

          for (const sched of futureSchedulesBeforeSchool) {
            const isEnrolled = sched.students.some((s) => s.id === studentId);
            const shouldBeEnrolled = student.beforeSchoolDays.includes(sched.day);
            const shouldBeRemoved = this.isOutsideActiveRange(student, sched.date);

            if (!isEnrolled && shouldBeEnrolled && !shouldBeRemoved) {
              sched.students.push(student);
              addPromises.push(this.dailyScheduleRepository.save(sched));
            } else if (isEnrolled && (!shouldBeEnrolled || shouldBeRemoved)) {
              sched.students = sched.students.filter((s) => s.id !== studentId);
              addPromises.push(this.dailyScheduleRepository.save(sched));
            }
          }
        }

        const removePromises: Promise<any>[] = [];

        for (const removedClass of removedClasses) {
          const schedulesToRemove = await this.dailyScheduleRepository
            .createQueryBuilder('ds')
            .innerJoin('ds.planning', 'pl')
            .andWhere('pl.classId = :removedClassId', { removedClassId: removedClass.id })
            .innerJoin('ds.students', 's_filter', 's_filter.id = :studentId', { studentId })
            .leftJoinAndSelect('ds.students', 'allStudents')
            .getMany();

          schedulesToRemove.forEach((sched) => {
            sched.students = sched.students.filter((t) => t.id !== studentId);
            removePromises.push(this.dailyScheduleRepository.save(sched));
          });
        }

        await Promise.all([...addPromises, ...removePromises]);

        student.classes = classes;
      }

      if (
        (updateData.classIdsTransition !== undefined && updateData.classIdsTransition.length >= 0) ||
        classesTransitionIds.length > 0
      ) {
        const classesTransition = updateData.classIdsTransition
          ? await this.classService.findByIds(updateData.classIdsTransition)
          : classesTransitionIds;

        await this.handleUpdateStudentScheduleTransition(student, classesTransition, updateData);

        student.classesTransition = classesTransition;
      }

      console.dir(student, { depth: null });

      if (!student.campus) {
        student.campus = null as any;
      }

      await this.repository.save(student);
    } catch (error) {
      console.error('Error updating student:', error);
      throw new ExceptionHandler(error);
    }
  }

  async handleUpdateStudentScheduleTransition(
    student: StudentEntity,
    classesTransition: ClassEntity[],
    updateData: any,
  ): Promise<void> {
    if (!student.startDateOfClassesTransition) {
      return;
    }

    const removedClasses = student.classesTransition?.filter(
      (oldC) => !classesTransition.some((newC) => newC.id === oldC.id),
    );

    const studentId = student.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startFrom = new Date(new Date(student.startDateOfClassesTransition).setHours(0, 0, 0, 0));

    const dateCondition = { date: MoreThanOrEqual(startFrom) };

    const addPromises: Promise<any>[] = [];

    // -------------------- ENROLLED --------------------
    if (Array.isArray(updateData.daysEnrolledTransition)) {
      const whereEnrolled: any = {
        planning: {
          class: {
            id: In(classesTransition.map((c) => c.id)),
            classType: ClassType.ENROLLED,
          },
        },
        ...dateCondition,
      };

      const futureSchedulesEnrolled = await this.dailyScheduleRepository.find({
        where: whereEnrolled,
        relations: ['students'],
      });

      for (const sched of futureSchedulesEnrolled) {
        const isEnrolled = sched.students.some((s) => s.id === studentId);
        const shouldBeEnrolled = student.daysEnrolledTransition.includes(sched.day);

        const shouldBeRemovedByEndDate =
          student.endDateOfClasses &&
          new Date(sched.date).setHours(0, 0, 0, 0) > new Date(student.endDateOfClasses as any).setHours(0, 0, 0, 0);

        if (!isEnrolled && shouldBeEnrolled && !shouldBeRemovedByEndDate) {
          sched.students.push(student);
          addPromises.push(this.dailyScheduleRepository.save(sched));
        } else if (isEnrolled && (!shouldBeEnrolled || shouldBeRemovedByEndDate)) {
          sched.students = sched.students.filter((s) => s.id !== studentId);
          addPromises.push(this.dailyScheduleRepository.save(sched));
        }
      }
    }

    // -------------------- AFTER SCHOOL --------------------
    if (Array.isArray(updateData.afterSchoolDaysTransition)) {
      const whereAfterSchool: any = {
        planning: {
          class: {
            id: In(classesTransition.map((c) => c.id)),
            classType: ClassType.AFTER_SCHOOL,
          },
        },
        ...dateCondition,
      };

      const futureSchedulesAfterSchool = await this.dailyScheduleRepository.find({
        where: whereAfterSchool,
        relations: ['students'],
      });

      for (const sched of futureSchedulesAfterSchool) {
        const isEnrolled = sched.students.some((s) => s.id === studentId);
        const shouldBeEnrolled = student.afterSchoolDaysTransition.includes(sched.day);
        const shouldBeRemovedByEndDate =
          student.endDateOfClasses &&
          new Date(sched.date).setHours(0, 0, 0, 0) > new Date(student.endDateOfClasses as any).setHours(0, 0, 0, 0);

        if (!isEnrolled && shouldBeEnrolled && !shouldBeRemovedByEndDate) {
          sched.students.push(student);
          addPromises.push(this.dailyScheduleRepository.save(sched));
        } else if (isEnrolled && (!shouldBeEnrolled || shouldBeRemovedByEndDate)) {
          sched.students = sched.students.filter((s) => s.id !== studentId);
          addPromises.push(this.dailyScheduleRepository.save(sched));
        }
      }
    }

    // -------------------- BEFORE SCHOOL --------------------
    if (Array.isArray(updateData.beforeSchoolDaysTransition)) {
      const whereBeforeSchool: any = {
        planning: {
          class: {
            id: In(classesTransition.map((c) => c.id)),
            classType: ClassType.BEFORE_SCHOOL,
          },
        },
        ...dateCondition,
      };

      const futureSchedulesBeforeSchool = await this.dailyScheduleRepository.find({
        where: whereBeforeSchool,
        relations: ['students'],
      });

      for (const sched of futureSchedulesBeforeSchool) {
        const isEnrolled = sched.students.some((s) => s.id === studentId);
        const shouldBeEnrolled = student.beforeSchoolDaysTransition.includes(sched.day);
        const shouldBeRemovedByEndDate =
          student.endDateOfClasses &&
          new Date(sched.date).setHours(0, 0, 0, 0) > new Date(student.endDateOfClasses as any).setHours(0, 0, 0, 0);

        if (!isEnrolled && shouldBeEnrolled && !shouldBeRemovedByEndDate) {
          sched.students.push(student);
          addPromises.push(this.dailyScheduleRepository.save(sched));
        } else if (isEnrolled && (!shouldBeEnrolled || shouldBeRemovedByEndDate)) {
          sched.students = sched.students.filter((s) => s.id !== studentId);
          addPromises.push(this.dailyScheduleRepository.save(sched));
        }
      }
    }

    const removePromises: Promise<any>[] = [];

    if (removedClasses) {
      for (const removedClass of removedClasses) {
        const schedulesToRemove = await this.dailyScheduleRepository
          .createQueryBuilder('ds')
          .innerJoin('ds.planning', 'pl')
          .andWhere('pl.classId = :removedClassId', { removedClassId: removedClass.id })
          .innerJoin('ds.students', 's_filter', 's_filter.id = :studentId', { studentId })
          .leftJoinAndSelect('ds.students', 'allStudents')
          .getMany();

        schedulesToRemove.forEach((sched) => {
          sched.students = sched.students.filter((t) => t.id !== studentId);
          removePromises.push(this.dailyScheduleRepository.save(sched));
        });
      }
    }

    await Promise.all([...addPromises, ...removePromises]);
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.repository.delete({ id });
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Student not found');
    }
  }

  async findByIds(ids: number[]): Promise<StudentEntity[]> {
    const students = await this.repository.findBy({ id: In(ids) });

    return students.map((student) => instanceToPlain(student)) as StudentEntity[];
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

  async findByClassIdAndDayEnrolledTransition(
    classId: number,
    day: WeekDayEnum,
    classType: ClassType,
  ): Promise<StudentEntity[]> {
    let column: string;

    switch (classType) {
      case ClassType.AFTER_SCHOOL:
        column = 'student.after_school_days_transition';
        break;
      case ClassType.BEFORE_SCHOOL:
        column = 'student.before_school_days_transition';
        break;
      case ClassType.ENROLLED:
      default:
        column = 'student.days_enrolled_transition';
        break;
    }

    const students = await this.repository
      .createQueryBuilder('student')
      .innerJoin('student.classesTransition', 'class', 'class.id = :classId', { classId })
      .andWhere(`:day = ANY(string_to_array(${column}, ','))`, { day })
      .getMany();

    return students;
  }
}
