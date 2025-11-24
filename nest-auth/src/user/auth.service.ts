import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { hashPassword, verifyPassword } from 'src/utils/hash';
import { signJwt } from 'src/utils/sign';
import { validateJwt } from 'src/utils/sign';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async signUp(userData: CreateUserDto) {
    //todo user already exists check
    try {
      const hashedPassword = await hashPassword(userData.password);
      const user = await this.userService.createUser({
        email: userData.email,
        password: hashedPassword,
      });

      const token = signJwt({ userId: user.id }, { expiresIn: '1h' });
      const refreshToken = signJwt(
        { userId: user.id },
        { expiresIn: '7d' },
        true,
      );
      return { userId: user.id, email: user.email, token, refreshToken };
    } catch {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async signIn(userData: CreateUserDto) {
    console.log('AuthService.signIn called with:', userData);
    const user = await this.userService.findByEmail(userData.email);
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }
    const isPasswordValid = await verifyPassword(
      user.password,
      userData.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }
    const token = signJwt({ userId: user.id }, { expiresIn: '5s' });
    const refreshToken = signJwt(
      { userId: user.id },
      { expiresIn: '7d' },
      true,
    );
    return { userId: user.id, email: user.email, token, refreshToken };
  }

  rotateToken(refreshTokenWithBearer: string) {
    if (!refreshTokenWithBearer)
      throw new UnauthorizedException('No refresh token provided');
    const [type, refreshToken] = refreshTokenWithBearer.split(' ');

    if (type.toLowerCase() !== 'bearer' || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    const { valid, expired, decoded } = validateJwt(refreshToken, true);
    if (!valid) {
      throw new UnauthorizedException(
        `Invalid refresh token${expired ? ' (expired)' : ''}`,
      );
    }

    const { userId } = decoded as { userId: number };
    const token = signJwt({ userId }, { expiresIn: '1h' });
    const newRefreshToken = signJwt({ userId }, { expiresIn: '7d' }, true);
    return { token, refreshToken: newRefreshToken };
  }
}
