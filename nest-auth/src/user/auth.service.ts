import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { hashPassword, verifyPassword } from 'src/utils/hash';
import { signJwt } from 'src/utils/sign';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async signUp(userData: CreateUserDto) {
    try {
      const hashedPassword = await hashPassword(userData.password);
      const user = await this.userService.createUser({
        email: userData.email,
        password: hashedPassword,
      });

      const token = signJwt({ userId: user.id }, { expiresIn: '1h' });
      return { userId: user.id, email: user.email, token };
    } catch {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async signIn(userData: CreateUserDto) {
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
    const token = signJwt({ userId: user.id }, { expiresIn: '1h' });
    return { userId: user.id, email: user.email, token };
  }
}
