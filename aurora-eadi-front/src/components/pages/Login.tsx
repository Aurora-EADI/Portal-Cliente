'use client';

import React, { useState } from 'react';
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

export function Login(){
  const { mutate: login, isPending: isLoading } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setError('');

    const role = email.includes('admin') ? UserRole.ADMIN : UserRole.SUPPLIER;

    login({ email, password, role }, {
      onError: (err) => {
        setError(err.message || 'Erro ao tentar login.');
      }
    });
  };

  const prefillAdmin = () => {
    setError('');
    setEmail('admin@docflow.com');
    setPassword('123456');
  };

  return (
    <div className="min-h-screen flex">
      {/* LADO ESQUERDO */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="mb-8">
            <Logo size="lg" />
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Logística Integrada e Inteligente
          </h1>
          <p className="text-white/90 text-lg">
            Controle total sobre armazém alfandegado, frota e operações de comércio exterior.
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
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
              <p className="text-gray-500 text-sm">
                Acesse sua conta para gerenciar operações logísticas
              </p>
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
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  <Button variant="link" className="p-0 text-primary-600 text-sm">
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
              </form>

              {/* DEMO */}
              <Separator className="my-6" />

              <p className="text-xs text-gray-400 uppercase font-semibold text-center mb-3 tracking-wider">
                Para demonstração
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                  onClick={prefillAdmin}
                >
                  Demo Admin
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
