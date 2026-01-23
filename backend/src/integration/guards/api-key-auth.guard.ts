import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

    const validApiKey = this.configService.get<string>('PROTHEUS_API_KEY');

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException({
        success: false,
        message: 'API Key inválida ou ausente',
        error: {
          code: 'INVALID_API_KEY',
          details: 'Forneça uma API Key válida no header X-API-Key ou Authorization',
        },
      });
    }

    return true;
  }
}