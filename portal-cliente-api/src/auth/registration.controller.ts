import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@thallesp/nestjs-better-auth';
import { RegistrationService } from './registration.service';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';

// Endpoints públicos: sem o limite global de 120/min bastaria, um atacante
// sondaria tokens de convite em massa. Limites próprios, bem mais apertados.
@Controller('public/convites')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':token')
  getInvite(@Param('token') token: string) {
    return this.registrationService.getInvite(token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterWithInviteDto) {
    return this.registrationService.register(dto);
  }
}
