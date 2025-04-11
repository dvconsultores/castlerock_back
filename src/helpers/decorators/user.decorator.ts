import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';

export const User = createParamDecorator((data: keyof AuthUser | undefined, ctx: ExecutionContext): any => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
