'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useLogin } from '../../hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function Login() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setError('');
    login({ email, password }, {
      onError: (loginError: Error) => setError(loginError.message || 'E-mail ou senha incorretos.'),
    });
  };

  return (
    <div className="min-h-screen flex overflow-y-auto">
      <div className="hidden lg:block lg:w-1/2 h-screen sticky top-0 bg-[#0b1624] overflow-hidden flex-shrink-0">
        <Image src="/logo_Portal_Cliente.png" alt="Portal do Cliente" fill priority className="object-cover object-left" sizes="50vw" />
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 py-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
            <Image src="/logo_Portal_Cliente.png" alt="Portal do Cliente" width={320} height={220} className="rounded-xl object-contain w-full max-w-[320px]" />
          </div>
          <div className="hidden lg:flex justify-center mb-6">
            <Image src="/aurora-MANAUS_logo_principal.png" alt="Aurora EADI Manaus" width={220} height={56} className="h-14 w-auto object-contain" />
          </div>
          <Card className="p-8 shadow-lg border border-gray-100 rounded-2xl">
            <CardHeader className="p-0 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo(a)</h2>
              <p className="text-gray-500 text-sm">Informe suas credenciais para acessar o Portal do Cliente.</p>
              {process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev' && (
                <div className="mt-4 bg-yellow-400 text-red-900 text-xs font-bold px-3 py-2 rounded-md uppercase tracking-wide shadow-md flex items-center justify-center gap-2 mx-auto w-fit">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  AMBIENTE DE DESENVOLVIMENTO
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
                  <Input type="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isPending} autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" disabled={isPending} autoComplete="current-password" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-transparent" disabled={isPending}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="link" className="p-0 text-primary-600 text-sm" type="button" disabled={isPending} onClick={() => router.push('/auth/forgot-password')}>Esqueceu sua senha?</Button>
                </div>
                <Button type="submit" disabled={isPending} className="w-full py-3 text-white shadow-lg shadow-primary-200">
                  {isPending ? <><Loader2 className="animate-spin mr-2" size={18} />Entrando...</> : 'Acessar Portal'}
                </Button>
              </form>
              <p className="mt-6 text-center text-xs text-gray-400">
                Cadastro disponível somente por convite.{' '}
                <button type="button" onClick={() => router.push('/registro')} className="text-primary-600 font-semibold hover:underline">Usar convite</button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
