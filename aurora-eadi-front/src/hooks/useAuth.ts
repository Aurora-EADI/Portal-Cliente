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
    onSuccess: async (user) => {
      await loginUser(user);
    },
    onError: (error: any) => {
      // Captura o erro para não quebrar a aplicação
      // console.error('Erro de autenticação:', error.message);
      // O erro agora fica disponível em loginMutation.error no componente
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async ({ company, user }: { company: CreateCompanyDTO; user: CreateUserDTO }) => {
      return await authService.register({ company, user });
    },
    onError: (error: any) => {
      console.error('Erro no registro:', error.message);
    },
  });
};