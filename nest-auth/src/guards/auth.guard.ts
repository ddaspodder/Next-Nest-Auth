import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { validateJwt } from 'src/utils/sign';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    // Normalize and validate header type
    if (!authHeader) throw new UnauthorizedException();

    const [type, token] = authHeader.split(' ');

    if (type.toLowerCase() !== 'bearer') throw new UnauthorizedException();

    if (!token) throw new UnauthorizedException();

    const { valid } = validateJwt(token);

    if (!valid) throw new UnauthorizedException();

    return true;
  }
}
