import { Global, Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { auth } from './better-auth';
import { BetterAuthDomainGuard } from '../common/guards/better-auth-domain.guard';

@Global()
@Module({
  imports: [
    BetterAuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
  ],
  controllers: [AuthController, RegistrationController],
  providers: [AuthService, RegistrationService, BetterAuthDomainGuard],
  exports: [AuthService, BetterAuthDomainGuard],
})
export class AuthModule {}
