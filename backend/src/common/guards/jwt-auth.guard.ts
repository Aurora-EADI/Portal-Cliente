// src/common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    console.log('[JWT AUTH GUARD] Verificando autenticação...');
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('[JWT AUTH GUARD] User retornado:', user);
    console.log('[JWT AUTH GUARD] Error:', err);
    console.log('[JWT AUTH GUARD] Info:', info);
    
    if (err || !user) {
      throw err || new Error('Não autorizado');
    }
    return user;
  }
}