import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';
import { useAuthContext } from '../context/AuthContext';

export const useLogin = () => {
  const { loginUser } = useAuthContext();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await authService.login(email, password);
    },
    onSuccess: async (data) => {
      const { user, expires_at } = data;
      await loginUser(user, expires_at);
    },
    onError: (_error: any) => {},
  });
};
