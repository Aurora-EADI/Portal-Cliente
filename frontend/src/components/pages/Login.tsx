'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function Login() {
  const router = useRouter();
  const { mutate: login, isPending: isLoading, isSuccess } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isSuccess) router.push('/dashboard');
  }, [isSuccess, router]);

  useEffect(() => {
    if (error && (email || password)) setError('');
  }, [email, password]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) { setError('Preencha e-mail e senha.'); return; }
    setError('');
    const role = email.includes('admin') ? UserRole.ADMIN : UserRole.EMPLOYEE;
    login({ email, password, role }, {
      onError: (err: any) => setError(err.message || 'E-mail ou senha incorretos.'),
    });
  };

  return (
    <div className="min-h-screen flex">

      {/* ── PAINEL ESQUERDO — imagem de capa ── */}
      <div className="hidden lg:block lg:w-1/2 h-screen sticky top-0 bg-[#0b1624] overflow-hidden flex-shrink-0">
        <Image
          src="/cover-home.png"
          alt="Portal do Cliente — Agende sua retirada de container"
          fill
          priority
          className="object-cover object-left"
          sizes="50vw"
        />
      </div>

      {/* ── PAINEL DIREITO — formulário ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Logo mobile (só aparece quando o painel esquerdo some) */}
          <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
            <Image
              src="/cover-home.png"
              alt="Portal do Cliente"
              width={320}
              height={220}
              className="rounded-xl object-contain"
              priority
            />
          </div>

          <Card className="p-8 shadow-lg border border-gray-100 rounded-2xl">
            <CardHeader className="p-0 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo(a)</h2>
              <p className="text-gray-500 text-sm">
                Informe suas credenciais para acessar o Portal do Cliente.
              </p>

              {process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev' && (
                <div className="mt-4 bg-yellow-400 text-red-900 text-xs font-bold px-3 py-2 rounded-md uppercase tracking-wide shadow-md flex items-center justify-center gap-2 mx-auto w-fit">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  AMBIENTE DE DESENVOLVIMENTO
                </div>
              )}

              {process.env.NEXT_PUBLIC_MOCK_MODE === 'true' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800 space-y-1">
                  <p className="font-bold text-blue-900 mb-1">🔑 Credenciais de demonstração</p>
                  <p><span className="font-semibold">Admin:</span> admin@aurora.com</p>
                  <p><span className="font-semibold">Cliente:</span> cliente@aurora.com</p>
                  <p className="text-blue-500 text-[10px]">Qualquer senha — sem backend ativo</p>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
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
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="link" className="p-0 text-primary-600 text-sm" type="button" disabled={isLoading}>
                    Esqueceu sua senha?
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 text-white shadow-lg shadow-primary-200"
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin mr-2" size={18} />Entrando...</>
                  ) : (
                    'Acessar Portal'
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-gray-400">
                Acesso exclusivo para clientes autorizados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
