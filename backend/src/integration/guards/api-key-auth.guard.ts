import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly logger = new Logger("ApiKeyAuthGuard");

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Tenta obter de múltiplos headers possíveis (case-insensitive por padrão no Nest/Express)
    const apiKey = (
      request.headers["x-api-key"] ||
      request.headers["api-key"] ||
      request.headers["authorization"]?.replace("Bearer ", "")
    )
      ?.toString()
      .trim();

    const validApiKey = this.configService
      .get<string>("PROTHEUS_API_KEY")
      ?.trim();

    // Log apenas em desenvolvimento ou se necessário debugar (cuidado com segredos em prod)
    if (!apiKey) {
      this.logger.warn(`Tentativa de acesso sem API Key de ${request.ip}`);
    }

    if (!validApiKey) {
      this.logger.error(
        "CONFIGURAÇÃO: PROTHEUS_API_KEY não definida no ambiente (.env)",
      );
    }

    if (!apiKey || apiKey !== validApiKey) {
      // Log de erro de validação (sem mostrar a chave completa por segurança)
      if (apiKey && validApiKey) {
        this.logger.error(
          `API Key inválida. Recebida: ${apiKey.substring(0, 3)}..., Esperada: ${validApiKey.substring(0, 3)}...`,
        );
      }

      throw new UnauthorizedException({
        success: false,
        message: "API Key inválida ou ausente",
        error: {
          code: "INVALID_API_KEY",
          details:
            "Forneça uma API Key válida no header X-API-Key, api-key ou Authorization",
        },
      });
    }

    return true;
  }
}
