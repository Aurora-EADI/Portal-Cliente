import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { BetterAuthDomainGuard } from '../common/guards/better-auth-domain.guard';

@Controller('account')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(BetterAuthDomainGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return this.authService.getProfile((req.user as { id: string }).id);
  }
}
