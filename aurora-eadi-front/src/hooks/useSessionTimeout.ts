import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { getAccessToken } from '@/services/auth/token.service';
import {
  getTimeUntilExpiration,
  getTimeUntilExpirationFormatted,
  isTokenExpiringSoon,
} from '@/lib/jwt-helper';

/**
 * Hook para monitorar o tempo de expiração da sessão
 * Fornece avisos e informações sobre quando a sessão vai expirar
 */
export function useSessionTimeout() {
  const { currentUser } = useAuthContext();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeRemainingFormatted, setTimeRemainingFormatted] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setTimeRemaining(null);
      setTimeRemainingFormatted('');
      setIsExpiringSoon(false);
      setHasShownWarning(false);
      return;
    }

    const checkExpiration = () => {
      const token = getAccessToken();
      if (!token) {
        setTimeRemaining(null);
        setTimeRemainingFormatted('');
        setIsExpiringSoon(false);
        return;
      }

      // Atualiza tempo restante
      const remaining = getTimeUntilExpiration(token);
      const formatted = getTimeUntilExpirationFormatted(token);
      const expiringSoon = isTokenExpiringSoon(token, 1); // 5 minutos

      setTimeRemaining(remaining);
      setTimeRemainingFormatted(formatted);
      setIsExpiringSoon(expiringSoon);

      // Mostra aviso apenas uma vez quando estiver próximo de expirar
      if (expiringSoon && !hasShownWarning && remaining > 0) {
        console.warn(
          `[SESSION TIMEOUT] Sessão expira em ${formatted}. O token será renovado automaticamente.`,
        );
        setHasShownWarning(true);
      }

      // Reset warning quando renovar
      if (!expiringSoon && hasShownWarning) {
        setHasShownWarning(false);
      }
    };

    // Checa imediatamente
    checkExpiration();

    // Checa a cada 30 segundos
    const interval = setInterval(checkExpiration, 30 * 1000);

    return () => clearInterval(interval);
  }, [currentUser, hasShownWarning]);

  return {
    timeRemaining, // Tempo em milissegundos
    timeRemainingFormatted, // Tempo formatado ("5 minutos", "2 horas", etc)
    isExpiringSoon, // true se faltam menos de 5 minutos
    isActive: currentUser !== null, // true se há sessão ativa
  };
}
