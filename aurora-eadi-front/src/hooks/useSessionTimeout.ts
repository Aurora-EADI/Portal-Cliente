import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { getTokenExpiry } from '@/services/auth/token.service';

/**
 * Hook para monitorar o tempo de expiração da sessão.
 * Com cookies httpOnly, usa o expires_at armazenado no sessionStorage
 * (salvo após login/refresh) em vez de decodificar o JWT.
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
      const expiresAt = getTokenExpiry();
      if (!expiresAt) {
        setTimeRemaining(null);
        setTimeRemainingFormatted('');
        setIsExpiringSoon(false);
        return;
      }

      const remaining = new Date(expiresAt).getTime() - Date.now();
      const remainingMinutes = Math.floor(remaining / (1000 * 60));
      const expiringSoon = remaining > 0 && remaining <= 5 * 60 * 1000; // menos de 5 min

      // Formata o tempo restante
      let formatted = '';
      if (remaining <= 0) {
        formatted = 'expirada';
      } else if (remainingMinutes < 60) {
        formatted = `${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(remainingMinutes / 60);
        formatted = `${hours} hora${hours !== 1 ? 's' : ''}`;
      }

      setTimeRemaining(remaining > 0 ? remaining : 0);
      setTimeRemainingFormatted(formatted);
      setIsExpiringSoon(expiringSoon);

      // Mostra aviso apenas uma vez quando estiver próximo de expirar
      if (expiringSoon && !hasShownWarning && remaining > 0) {
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
    timeRemaining,          // Tempo em milissegundos
    timeRemainingFormatted, // Tempo formatado ("5 minutos", "2 horas", etc)
    isExpiringSoon,         // true se faltam menos de 5 minutos
    isActive: currentUser !== null, // true se há sessão ativa
  };
}
