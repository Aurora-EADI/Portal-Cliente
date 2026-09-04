'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Página exibida quando a sessão do usuário expira
 * Fornece feedback claro e ação para fazer login novamente
 */
export default function SessionExpiredPage() {
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Sessão Expirada</CardTitle>
            <CardDescription className="mt-2">
              Sua sessão expirou por inatividade
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Por motivos de segurança</p>
                <p>
                  Por questões de segurança, sua sessão foi encerrada automaticamente após um
                  período de inatividade. Por favor, faça login novamente para continuar.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleLoginRedirect} className="w-full" size="lg">
              Fazer Login Novamente
            </Button>

            <p className="text-center text-xs text-gray-500">
              Seus dados estão seguros e não foram perdidos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
