import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useAuthContext } from '@/context/AuthContext';

function getTokenExpiresAt(): number | null {
  const token = Cookies.get('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
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
