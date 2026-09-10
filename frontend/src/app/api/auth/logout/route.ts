import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth-cookie';

// O cookie de sessao e httpOnly, entao o cliente nao consegue apaga-lo sozinho:
// o logout precisa passar pelo servidor.
export async function POST() {
  return clearAuthCookie(NextResponse.json({ ok: true }));
}
