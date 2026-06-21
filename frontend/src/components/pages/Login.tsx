'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../hooks/useAuth';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function Login() {
  const router = useRouter();
  const { mutate: login, isPending: isLoggingIn, isSuccess } = useLogin();

  const [mode, setMode] = useState<'login' | 'register' | 'success'>('login');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Register fields
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regConfirmar, setRegConfirmar] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regEmpresa, setRegEmpresa] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (isSuccess) router.push('/dashboard');
  }, [isSuccess, router]);

  useEffect(() => {
    if (error) setError('');
  }, [email, password, regNome, regEmail, regSenha, regConfirmar, regCnpj, regEmpresa]);

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) { setError('Preencha e-mail e senha.'); return; }
    setError('');
    login({ email, password }, {
      onError: (err: any) => setError(err.message || 'E-mail ou senha incorretos.'),
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regNome.trim() || !regEmail.trim() || !regSenha || !regCnpj || !regEmpresa.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (regSenha.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
    if (regSenha !== regConfirmar) { setError('As senhas não coincidem.'); return; }
    if (regCnpj.replace(/\D/g, '').length !== 14) { setError('CNPJ deve ter 14 dígitos.'); return; }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: regNome.trim(),
          email: regEmail.trim().toLowerCase(),
          senha: regSenha,
          cnpj: regCnpj,
          nomeEmpresa: regEmpresa.trim(),
          telefone: regTelefone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Erro ao criar conta.'); return; }
      login({ email: regEmail.trim().toLowerCase(), password: regSenha }, {
        onError: () => {
          setMode('success');
        },
      });
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsRegistering(false);
    }
  };

  const isLoading = mode === 'login' ? isLoggingIn : isRegistering;

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — imagem */}
      <div className="hidden lg:block lg:w-1/2 h-screen sticky top-0 bg-[#0b1624] overflow-hidden flex-shrink-0">
        <Image src="/cover-home.png" alt="Portal do Cliente" fill priority className="object-cover object-left" sizes="50vw" />
      </div>

      {/* Painel direito — formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
            <Image src="/cover-home.png" alt="Portal do Cliente" width={320} height={220} className="rounded-xl object-contain" priority />
          </div>

          <Card className="p-8 shadow-lg border border-gray-100 rounded-2xl">
            {/* ── SUCESSO ── */}
            {mode === 'success' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Cadastro realizado!</h2>
                <p className="text-sm text-gray-500">Sua conta foi criada. Faça login com seu e-mail e senha.</p>
                <Button onClick={() => { switchMode('login'); setEmail(regEmail); }} className="w-full py-3 text-white shadow-lg shadow-primary-200">
                  Fazer login
                </Button>
              </div>
            )}

            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <>
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
                      <Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
                    </div>

                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="pr-10"
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-transparent" disabled={isLoading}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="link" className="p-0 text-primary-600 text-sm" type="button" disabled={isLoading}>Esqueceu sua senha?</Button>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full py-3 text-white shadow-lg shadow-primary-200">
                      {isLoading ? <><Loader2 className="animate-spin mr-2" size={18} />Entrando...</> : 'Acessar Portal'}
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-xs text-gray-400">
                    Não tem uma conta?{' '}
                    <button type="button" onClick={() => switchMode('register')} className="text-primary-600 font-semibold hover:underline">
                      Cadastre-se
                    </button>
                  </p>
                </CardContent>
              </>
            )}

            {/* ── CADASTRO ── */}
            {mode === 'register' && (
              <>
                <CardHeader className="p-0 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Criar conta</h2>
                  <p className="text-gray-500 text-sm">Cadastre sua empresa para acessar o Portal do Cliente.</p>
                </CardHeader>

                <CardContent className="p-0">
                  {error && (
                    <Alert variant="destructive" className="mb-5 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Nome completo *</Label>
                      <Input placeholder="Seu nome" value={regNome} onChange={e => setRegNome(e.target.value.toUpperCase())} disabled={isLoading} className="uppercase" />
                    </div>

                    <div className="space-y-1.5">
                      <Label>E-mail *</Label>
                      <Input type="email" placeholder="seu@empresa.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Senha *</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 6 chars"
                            value={regSenha}
                            onChange={e => setRegSenha(e.target.value)}
                            disabled={isLoading}
                            className="pr-9"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-transparent">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Confirmar *</Label>
                        <Input type={showPassword ? 'text' : 'password'} placeholder="Repita" value={regConfirmar} onChange={e => setRegConfirmar(e.target.value)} disabled={isLoading} />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dados da empresa</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label>CNPJ *</Label>
                      <Input placeholder="00.000.000/0000-00" value={regCnpj} onChange={e => setRegCnpj(formatCNPJ(e.target.value))} disabled={isLoading} maxLength={18} className="font-mono" />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Razão Social *</Label>
                      <Input placeholder="Nome da empresa" value={regEmpresa} onChange={e => setRegEmpresa(e.target.value.toUpperCase())} disabled={isLoading} className="uppercase" />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Telefone</Label>
                      <Input placeholder="(00) 00000-0000" value={regTelefone} onChange={e => setRegTelefone(formatPhone(e.target.value))} disabled={isLoading} maxLength={15} />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full py-3 text-white shadow-lg shadow-primary-200 mt-2">
                      {isLoading ? <><Loader2 className="animate-spin mr-2" size={18} />Criando conta...</> : 'Criar conta'}
                    </Button>
                  </form>

                  <p className="mt-5 text-center text-xs text-gray-400">
                    Já tem uma conta?{' '}
                    <button type="button" onClick={() => switchMode('login')} className="text-primary-600 font-semibold hover:underline">
                      Faça login
                    </button>
                  </p>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
