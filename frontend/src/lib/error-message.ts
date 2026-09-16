export const APP_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_INACTIVE: 'USER_INACTIVE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  FOREIGN_KEY_CONFLICT: 'FOREIGN_KEY_CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

export const APP_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  USER_INACTIVE: 'Usuário inativo. Entre em contato com o administrador.',
  UNAUTHORIZED: 'Sua sessão expirou. Entre novamente.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para realizar esta ação.',
  RESOURCE_NOT_FOUND: 'Registro não encontrado.',
  RESOURCE_CONFLICT: 'Não foi possível concluir a operação devido a um conflito de dados.',
  FOREIGN_KEY_CONFLICT: 'Operação não permitida: registro vinculado a outros dados.',
  VALIDATION_ERROR: 'Verifique os dados informados.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  INTERNAL_ERROR: 'Ocorreu um erro interno. Tente novamente mais tarde.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
};

export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Verifique os dados informados.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Registro não encontrado.',
  409: 'Não foi possível concluir a operação devido a um conflito de dados.',
  422: 'Verifique os dados informados.',
  429: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  500: 'Ocorreu um erro interno. Tente novamente mais tarde.',
  502: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
  503: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
  504: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
};

const FORBIDDEN_LEAK_PATTERNS = [
  /internal server error/i,
  /invalid email or password/i,
  /unauthorized/i,
  /forbidden/i,
  /not found/i,
  /bad request/i,
  /prisma/i,
  /p20\d\d/i,
  /sql/i,
  /select /i,
  /insert /i,
  /update /i,
  /delete /i,
  /column/i,
  /relation/i,
  /table/i,
  /failed to fetch/i,
  /network error/i,
  /econnrefused/i,
  /driveradaptererror/i,
];

export function containsTechnicalLeak(text: unknown): boolean {
  if (typeof text !== 'string') return false;
  return FORBIDDEN_LEAK_PATTERNS.some((pattern) => pattern.test(text));
}

export type NormalizedAuthError = Error & {
  status?: number;
  code?: string;
};

export function normalizeAuthError(error: unknown): NormalizedAuthError {
  const err = (error || {}) as Record<string, unknown>;
  const status = Number(err.status || err.statusCode || 0);
  const code = String(err.code || '');
  const rawMessage = String(err.message || '');

  // 1. Credenciais inválidas (401 ou código Better Auth)
  if (
    code === 'INVALID_EMAIL_OR_PASSWORD' ||
    code === 'USER_NOT_FOUND' ||
    status === 401 ||
    rawMessage.includes('Invalid email or password')
  ) {
    const normalized: NormalizedAuthError = new Error(APP_ERROR_MESSAGES.INVALID_CREDENTIALS);
    normalized.status = 401;
    normalized.code = APP_ERROR_CODES.INVALID_CREDENTIALS;
    return normalized;
  }

  // 2. Usuário inativo (403)
  if (code === 'USER_INACTIVE' || status === 403 || rawMessage.includes('inativo')) {
    const normalized: NormalizedAuthError = new Error(APP_ERROR_MESSAGES.USER_INACTIVE);
    normalized.status = 403;
    normalized.code = APP_ERROR_CODES.USER_INACTIVE;
    return normalized;
  }

  // 3. Rate limit (429)
  if (status === 429 || code === 'TOO_MANY_REQUESTS') {
    const normalized: NormalizedAuthError = new Error(APP_ERROR_MESSAGES.TOO_MANY_REQUESTS);
    normalized.status = 429;
    normalized.code = APP_ERROR_CODES.TOO_MANY_REQUESTS;
    return normalized;
  }

  // 4. Erros 500, banco indisponível, Prisma ou erro interno do Better Auth
  if (status >= 500 || containsTechnicalLeak(rawMessage) || !status) {
    const normalized: NormalizedAuthError = new Error(APP_ERROR_MESSAGES.SERVICE_UNAVAILABLE);
    normalized.status = status || 500;
    normalized.code = APP_ERROR_CODES.INTERNAL_ERROR;
    return normalized;
  }

  // Fallback seguro pt-BR
  const normalized: NormalizedAuthError = new Error(APP_ERROR_MESSAGES.INTERNAL_ERROR);
  normalized.status = status;
  normalized.code = code || APP_ERROR_CODES.INTERNAL_ERROR;
  return normalized;
}

type ErrorResponse = {
  data?: {
    code?: string;
    message?: unknown;
  };
  status?: number;
};

type ErrorWithResponse = {
  response?: ErrorResponse;
  status?: number;
  code?: string;
  message?: string;
};

function hasResponse(error: unknown): error is ErrorWithResponse {
  return typeof error === 'object' && error !== null && ('response' in error || 'status' in error);
}

export function getUserFriendlyError(error: unknown, fallback?: string): string {
  if (!error) return fallback || APP_ERROR_MESSAGES.INTERNAL_ERROR;

  const err = error as ErrorWithResponse;
  const response = err.response;
  const data = response?.data;
  const status = Number(response?.status || err.status || 0);

  // 1. Prioriza código estável da aplicação
  const appCode = data?.code || err.code;
  if (appCode && APP_ERROR_MESSAGES[appCode]) {
    return APP_ERROR_MESSAGES[appCode];
  }

  // 2. Erros de rede ou conexão
  const rawMessage = String(err.message || '');
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ERR_NETWORK' ||
    err.code === 'ETIMEDOUT' ||
    rawMessage.includes('Network Error') ||
    rawMessage.includes('Failed to fetch') ||
    rawMessage.includes('connect ECONNREFUSED')
  ) {
    return APP_ERROR_MESSAGES.SERVICE_UNAVAILABLE;
  }

  // 3. Mensagem de validação segura vinda da API
  if (data?.message) {
    if (typeof data.message === 'string' && !containsTechnicalLeak(data.message)) {
      return data.message;
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      const cleanItems = data.message.filter(
        (m): m is string => typeof m === 'string' && !containsTechnicalLeak(m),
      );
      if (cleanItems.length > 0) {
        return cleanItems.join(', ');
      }
    }
  }

  // 4. Mapeamento por status HTTP
  if (status && HTTP_STATUS_MESSAGES[status]) {
    return HTTP_STATUS_MESSAGES[status];
  }

  // 5. Verifica se mensagem é um fallback seguro conhecido
  if (!containsTechnicalLeak(rawMessage) && rawMessage.trim().length > 0) {
    if (Object.values(APP_ERROR_MESSAGES).includes(rawMessage)) {
      return rawMessage;
    }
  }

  return fallback || APP_ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Alias compatível com chamadas existentes no frontend.
 */
export const getErrorMessage = getUserFriendlyError;

export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as ErrorWithResponse;
  return err.response?.status || err.status;
}
