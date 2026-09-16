'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { getUserFriendlyError } from '@/lib/error-message';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Senha deve ter no mínimo 8 caracteres.');
    if (password !== confirmation) return setError('As senhas não coincidem.');
    if (!token) return setError('Token de redefinição ausente ou inválido.');
    setLoading(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (result.error) setError(result.error.message || 'Não foi possível redefinir a senha.');
    if (result.error) setError(getUserFriendlyError(result.error, 'Não foi possível redefinir a senha.'));
    else setMessage('Senha redefinida com sucesso.');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold">Criar nova senha</h1>
        <input className="w-full rounded-md border p-3" type="password" required minLength={8} placeholder="Nova senha" value={password} onChange={(event) => setPassword(event.target.value)} />
        <input className="w-full rounded-md border p-3" type="password" required minLength={8} placeholder="Confirmar senha" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-md bg-primary-600 p-3 text-white disabled:opacity-50" disabled={loading || Boolean(message)} type="submit">
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
        <button className="w-full p-2 text-sm text-primary-600" type="button" onClick={() => router.push('/')}>Voltar ao login</button>
      </form>
    </main>
  );
}
