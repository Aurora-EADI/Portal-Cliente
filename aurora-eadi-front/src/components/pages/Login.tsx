'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Logo } from '../ui/Logo';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface LoginProps {
  onRegisterClick?: () => void;
}

export function Login({ onRegisterClick }: LoginProps) {
  const router = useRouter();
  const { mutate: login, isPending: isLoading, isSuccess } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Redireciona após login bem-sucedido
  useEffect(() => {
    if (isSuccess) {
      router.push('/dashboard');
    }
  }, [isSuccess, router]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setError('');

    const role = email.includes('admin') ? UserRole.ADMIN : UserRole.SUPPLIER;

    login({ email, password, role }, {
      onError: (err: any) => {

        setError(err.message || 'E-mail ou senha incorretos. Tente novamente.');
      }
    });
  };

  // ✅ Preenche e já faz login automático (melhor UX)
  const prefillAdmin = () => {
    setError('');
    const adminEmail = 'admin@aurora.com.br';
    const adminPassword = '123456';

    setEmail(adminEmail);
    setPassword(adminPassword);

    // Faz login automaticamente
    login({
      email: adminEmail,
      password: adminPassword,
      role: UserRole.ADMIN
    }, {
      onError: (err: any) => {
        setError(err.message || 'Erro ao tentar login demo.');
      }
    });
  };

  // ✅ Limpa erro quando usuário começa a digitar (melhor UX)
  useEffect(() => {
    if (error && (email || password)) {
      setError('');
    }
  }, [email, password]);

  return (
    <div className="min-h-screen flex">
      <div
        className="
    hidden lg:flex lg:w-1/2 
    relative overflow-hidden 
    bg-black/40 
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-600/70 before:to-primary-800/40
    bg-[url('/cover-home.jpg')] bg-cover bg-center
    p-12 flex-col justify-between
  "
      >

        {/* CONTEÚDO */}
        <div className="relative z-10">
          <div className="mb-8">
            <Logo src='/logo_principal.png' size="lg" />
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Gestão completa em um só lugar
          </h1>
          <p className="text-white/90 text-lg">
            Acompanhe todas as operações em um só lugar Acesse informações de faturamento, movimentação de cargas, gestão de estoque e documento. Dados integrados e atualizados para facilitar sua rotina operacional.
          </p>
        </div>

        <div className="relative z-10 text-white/70 text-sm">
          © 2025 Aurora EADI. Todos os direitos reservados.
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">

          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>

          <Card className="p-8 shadow-lg border border-gray-100 rounded-2xl">
            <CardHeader className="p-0 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo(a)</h2>
              <p className="text-gray-500 text-sm">
                Informe suas credenciais para acessar o sistema.
              </p>

              {/* Badge de Desenvolvimento */}
              {process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev' && (
                <div className="mt-4 bg-yellow-400 text-red-900 text-xs font-bold px-3 py-2 rounded-md uppercase tracking-wide shadow-md flex items-center justify-center gap-2 mx-auto w-fit">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  AMBIENTE DE DESENVOLVIMENTO
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">

              {/* ALERTA DE ERRO */}
              {error && (
                <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro no login</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-5">

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* SENHA */}
                <div className="space-y-2">
                  <Label>Senha</Label>

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      disabled={isLoading}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="link" className="p-0 text-primary-600 text-sm" disabled={isLoading}>
                    Esqueceu sua senha?
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 text-white shadow-lg shadow-primary-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Entrando...
                    </>
                  ) : (
                    "Acessar Portal"
                  )}
                </Button>

                {/* CADASTRO DE FORNECEDOR */}
                <Separator className="my-6" />

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    É fornecedor e ainda não tem cadastro?
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-primary-300 text-primary-600 hover:bg-primary-50 hover:border-primary-400"
                    onClick={onRegisterClick}
                    disabled={isLoading}
                  >
                    Cadastrar como Fornecedor
                  </Button>
                </div>
              </form>

              {/* DEMO */}
              {/* <Separator className="my-6" />

              <p className="text-xs text-gray-400 uppercase font-semibold text-center mb-3 tracking-wider">
                Para demonstração
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                  onClick={prefillAdmin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Conectando...
                    </>
                  ) : (
                    "Demo Admin"
                  )}
                </Button>
              </div> */}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};