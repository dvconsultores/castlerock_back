import { UserRole } from '../enums/user-role.enum';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  campusId?: number;
}
