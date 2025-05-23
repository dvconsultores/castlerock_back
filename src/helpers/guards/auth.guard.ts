import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/env';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../shared/enums/user-role.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token no encontrado');
    }

    const token = authHeader.split(' ')[1];

    if (token === this.configService.get('API_KEY')) {
      return true;
    }

    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET', { infer: true }),
      });

      const roles = this.reflector.getAllAndOverride<UserRole[]>('roles', [context.getHandler(), context.getClass()]);

      if (roles && !roles.includes(payload.role)) {
        throw new UnauthorizedException('No autorizado');
      }

      request['user'] = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}

// const request = context.switchToHttp().getRequest();
// const token = this.extractTokenFromHeader(request);
// if (!token) {
//   console.log('token not found');
//   throw new UnauthorizedException();
// }
// try {
//   const payload = await this.jwtService.verifyAsync(token, {
//     secret: process.env.JWT_SECRET,
//   });

//   request['client'] = payload;
// } catch (e: any) {
//   console.log('error');
//   console.log(e);
//   throw new UnauthorizedException();
// }
// return true;
// }

// private extractTokenFromHeader(request: Request): string | undefined {
// const [type, token] = request.headers.authorization?.split(' ') ?? [];
// return type === 'Bearer' ? token : undefined;
// }
