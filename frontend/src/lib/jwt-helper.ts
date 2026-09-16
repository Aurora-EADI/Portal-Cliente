/**
 * Utilitários para trabalhar com JWT (JSON Web Tokens)
 * Funções bem organizadas e separadas por responsabilidade
 */

/**
 * Interface do payload do JWT decodificado
 */
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  role: string;
  companyId?: string;
  type?: 'access' | 'refresh';
  exp: number; // Timestamp de expiração
  iat: number; // Timestamp de emissão
}

/**
 * Decodifica um JWT sem validar a assinatura
 * ATENÇÃO: Não use para validação de segurança, apenas para ler dados
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    // JWT tem 3 partes separadas por ponto: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decodifica o payload (segunda parte)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));

    return decoded as JWTPayload;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}

/**
 * Verifica se um token JWT está expirado
 * Adiciona buffer de 60 segundos para evitar race conditions
 */
export function isTokenExpired(token: string, bufferSeconds: number = 5): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true; // Token inválido = considerado expirado
    }

    const currentTime = Math.floor(Date.now() / 1000); // Timestamp atual em segundos
    const expirationWithBuffer = decoded.exp - bufferSeconds;

    return currentTime >= expirationWithBuffer;
  } catch (error) {
    return true; // Em caso de erro, considera expirado
  }
}

/**
 * Retorna a data de expiração do token
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    // Converte timestamp (segundos) para Date
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Retorna a data de emissão do token
 */
export function getTokenIssuedAt(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.iat) {
      return null;
    }

    return new Date(decoded.iat * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Retorna o tempo restante até a expiração em milissegundos
 * Retorna 0 se já expirado
 */
export function getTimeUntilExpiration(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return 0;
  }

  const remaining = expiration.getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Retorna o tempo restante até a expiração em formato legível
 */
export function getTimeUntilExpirationFormatted(token: string): string {
  const ms = getTimeUntilExpiration(token);
  if (ms === 0) {
    return 'Expirado';
  }

  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} dia${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else {
    return 'Menos de 1 minuto';
  }
}

/**
 * Verifica se o token está próximo de expirar
 * @param token Token JWT
 * @param thresholdMinutes Threshold em minutos (padrão: 5 minutos)
 */
export function isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
  const ms = getTimeUntilExpiration(token);
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return ms > 0 && ms <= thresholdMs;
}

/**
 * Extrai o ID do usuário do token
 */
export function getUserIdFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.sub || null;
}

/**
 * Extrai o email do token
 */
export function getEmailFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.email || null;
}

/**
 * Extrai o role do token
 */
export function getRoleFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.role || null;
}

/**
 * Extrai o tipo do token (access ou refresh)
 */
export function getTokenType(token: string): 'access' | 'refresh' | null {
  const decoded = decodeToken(token);
  return decoded?.type || null;
}

/**
 * Valida se o token tem estrutura JWT válida (sem validar assinatura)
 */
export function isValidJWTStructure(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  try {
    // Tenta decodificar cada parte
    atob(parts[0]); // header
    atob(parts[1]); // payload
    // A assinatura não precisa ser decodificada
    return true;
  } catch {
    return false;
  }
}

/**
 * Calcula a porcentagem de vida útil restante do token
 * 100% = recém emitido, 0% = expirado
 */
export function getTokenLifePercentage(token: string): number {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.iat || !decoded.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const totalLifetime = decoded.exp - decoded.iat;
    const remaining = decoded.exp - now;

    if (remaining <= 0) return 0;
    if (remaining >= totalLifetime) return 100;

    return Math.round((remaining / totalLifetime) * 100);
  } catch {
    return 0;
  }
}
