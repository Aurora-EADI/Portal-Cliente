import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { UserRole, CreateCompanyDTO, CreateUserDTO } from '../types';

export const useLogin = () => {
  const { loginUser } = useAuthContext();

  return useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: UserRole }) => {
      return await authService.login(email, password, role);
    },
    onSuccess: (user) => {
      loginUser(user);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async ({ company, user }: { company: CreateCompanyDTO; user: CreateUserDTO }) => {
      return await authService.register({ company, user });
    },
  });
};