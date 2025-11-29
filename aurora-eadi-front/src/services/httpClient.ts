import axios from 'axios';

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT em todas as requisições
httpClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authSession = localStorage.getItem('auth_session');
      if (authSession) {
        const user = JSON.parse(authSession);
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros de autenticação
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session');
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default httpClient;