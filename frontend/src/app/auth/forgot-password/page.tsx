'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: '/auth/reset-password',
    });
    setLoading(false);
    if (result.error) setError(result.error.message || 'Não foi possível enviar o e-mail.');
    else setMessage('Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold">Redefinir senha</h1>
        <p className="text-sm text-gray-500">Informe seu e-mail para receber um link seguro.</p>
        <input className="w-full rounded-md border p-3" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-md bg-primary-600 p-3 text-white disabled:opacity-50" disabled={loading} type="submit">
          {loading ? 'Enviando...' : 'Enviar instruções'}
        </button>
        <button className="w-full p-2 text-sm text-primary-600" type="button" onClick={() => router.push('/')}>Voltar ao login</button>
      </form>
    </main>
  );
}
