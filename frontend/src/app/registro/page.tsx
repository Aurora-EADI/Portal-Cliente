'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [telefone, setTelefone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConvite, setLoadingConvite] = useState(true);
  const [conviteTipo, setConviteTipo] = useState('');
  const [conviteInvalid, setConviteInvalid] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) { setLoadingConvite(false); return; }
    fetch(`/api/auth/convite/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setConviteInvalid(data.message || 'Convite inválido');
          return;
        }
        const data = await res.json();
        if (data.nome) setNome(data.nome.toUpperCase());
        if (data.email) setEmail(data.email);
        if (data.tipo) setConviteTipo(data.tipo);
      })
      .catch(() => setConviteInvalid('Erro ao validar convite'))
      .finally(() => setLoadingConvite(false));
  }, [token]);

  useEffect(() => {
    if (error) setError('');
  }, [nome, email, senha, confirmar]);

  if (loadingConvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!token || conviteInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <Card className="max-w-md w-full p-8 shadow-lg border border-gray-100 rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{conviteInvalid || 'Convite Necessário'}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {conviteInvalid
              ? 'Este convite não é mais válido. Solicite um novo convite ao recinto Aurora EADI.'
              : 'Para se cadastrar no Portal do Cliente, você precisa de um link de convite gerado pelo recinto Aurora EADI.'}
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Ir para Login
          </Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nome.trim() || !email.trim() || !senha) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (senha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha,
          token,
          telefone: telefone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erro ao criar conta.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 h-screen sticky top-0 bg-[#0b1624] overflow-hidden flex-shrink-0">
        <Image src="/logo_Portal_Cliente.png" alt="Portal do Cliente" fill priority className="object-cover object-left" sizes="50vw" />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
            <Image src="/logo_Portal_Cliente.png" alt="Portal do Cliente" width={320} height={220} className="rounded-xl object-contain" priority />
          </div>

          {/* Marca da Aurora acima do card: quem chega aqui vem de um convite
              por e-mail e precisa reconhecer de quem é o cadastro. Some no
              mobile, onde o logo do Portal do Cliente já cumpre esse papel. */}
          <div className="hidden lg:flex justify-center mb-6">
            <Image
              src="/aurora-MANAUS_logo_principal.png"
              alt="Aurora EADI Manaus"
              width={220}
              height={56}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>

          <Card className="p-8 shadow-lg border border-gray-100 rounded-2xl">
            {success ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Cadastro realizado!</h2>
                <p className="text-sm text-gray-500">Sua conta foi criada com sucesso. Faça login com seu e-mail e senha.</p>
                <Button onClick={() => router.push('/')} className="w-full py-3 text-white shadow-lg shadow-primary-200">
                  Fazer login
                </Button>
              </div>
            ) : (
              <>
                <CardHeader className="p-0 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">Convite válido</span>
                    {conviteTipo && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{conviteTipo}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Criar sua conta</h2>
                  <p className="text-gray-500 text-sm">Preencha seus dados para acessar o Portal do Cliente.</p>
                </CardHeader>

                <CardContent className="p-0">
                  {error && (
                    <Alert variant="destructive" className="mb-5 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Nome completo *</Label>
                      <Input
                        placeholder="Seu nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value.toUpperCase())}
                        disabled={isLoading}
                        className="uppercase"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>E-mail *</Label>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Senha *</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 6 chars"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            disabled={isLoading}
                            className="pr-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Confirmar *</Label>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Repita"
                          value={confirmar}
                          onChange={(e) => setConfirmar(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Telefone</Label>
                      <Input
                        placeholder="(00) 00000-0000"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        disabled={isLoading}
                        maxLength={15}
                      />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full py-3 text-white shadow-lg shadow-primary-200 mt-2">
                      {isLoading ? (
                        <><Loader2 className="animate-spin mr-2" size={18} />Criando conta...</>
                      ) : (
                        'Criar conta'
                      )}
                    </Button>
                  </form>

                  <p className="mt-5 text-center text-xs text-gray-400">
                    Já tem uma conta?{' '}
                    <button type="button" onClick={() => router.push('/')} className="text-primary-600 font-semibold hover:underline">
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

export default function RegistroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <RegistroContent />
    </Suspense>
  );
}
