import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { getSessionExpiresAt } from '@/services/api';

// O token e httpOnly e nao pode mais ser decodificado no cliente. O login
// devolve `expires_at`, que fica no sessionStorage — ver services/api.ts.
function getTokenExpiresAt(): number | null {
  const expiresAt = getSessionExpiresAt();
  if (!expiresAt) return null;
  const parsed = Date.parse(expiresAt);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
}

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
      const expiresAt = getTokenExpiresAt();
      if (!expiresAt) {
        setTimeRemaining(null);
        setTimeRemainingFormatted('');
        setIsExpiringSoon(false);
        return;
      }

      const remaining = expiresAt * 1000 - Date.now();
      const remainingMinutes = Math.floor(remaining / (1000 * 60));
      const expiringSoon = remaining > 0 && remaining <= 5 * 60 * 1000;

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

      if (expiringSoon && !hasShownWarning && remaining > 0) {
        setHasShownWarning(true);
      }
      if (!expiringSoon && hasShownWarning) {
        setHasShownWarning(false);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 30 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, hasShownWarning]);

  return {
    timeRemaining,
    timeRemainingFormatted,
    isExpiringSoon,
    isActive: currentUser !== null,
  };
}
