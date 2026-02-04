import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { UserRole } from '../../shared/enums/user-role.enum';

export const User = createParamDecorator((data: keyof AuthUser | undefined, ctx: ExecutionContext): any => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  if (user.role !== UserRole.ADMIN && !user?.campusId) {
    throw new Error('User campusId is not defined');
  }

  return data ? user?.[data] : user;
});
