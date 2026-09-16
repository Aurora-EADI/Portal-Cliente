import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import { RegistrationService } from './registration.service';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';

@Controller('public/convites')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Public()
  @Get(':token')
  getInvite(@Param('token') token: string) {
    return this.registrationService.getInvite(token);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterWithInviteDto) {
    return this.registrationService.register(dto);
  }
}
