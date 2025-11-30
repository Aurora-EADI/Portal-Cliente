import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller'; // ← ADICIONE
import { AuthService } from './auth.service';       // ← ADICIONE
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AuthController], // ← ADICIONE
  providers: [AuthService, JwtStrategy], // ← ADICIONE AuthService
  exports: [JwtModule, AuthService], // ← EXPORTE AuthService se outros módulos usarem
})
export class AuthModule {}