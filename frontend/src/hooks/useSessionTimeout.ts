import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export function useSessionTimeout() {
  const { currentUser } = useAuthContext();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeRemainingFormatted, setTimeRemainingFormatted] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setTimeRemaining(null);
      setTimeRemainingFormatted('');
      setIsExpiringSoon(false);
      return;
    }
    // Better Auth usa uma sessão httpOnly opaca. A validade é verificada pelo
    // servidor e não é copiada para sessionStorage nem decodificada no cliente.
    setTimeRemaining(null);
    setTimeRemainingFormatted('');
    setIsExpiringSoon(false);
  }, [currentUser]);

  return {
    timeRemaining,
    timeRemainingFormatted,
    isExpiringSoon,
    isActive: currentUser !== null,
  };
}
