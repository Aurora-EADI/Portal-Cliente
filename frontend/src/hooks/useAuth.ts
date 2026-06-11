import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { UserRole } from '../types';

export const useLogin = () => {
  const { loginUser } = useAuthContext();

  return useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: UserRole }) => {
      return await authService.login(email, password, role);
    },
    onSuccess: async (data) => {
      const { user, expires_at } = data;
      await loginUser(user, expires_at);
    },
    onError: (_error: any) => {},
  });
};