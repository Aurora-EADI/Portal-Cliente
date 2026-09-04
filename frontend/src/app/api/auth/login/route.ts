import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !user.active) {
      return NextResponse.json({ message: 'Email ou senha inválidos' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: 'Email ou senha inválidos' }, { status: 401 });
    }

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    const { password: _password, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('[Login]', error);
    return NextResponse.json({ message: 'Erro ao autenticar' }, { status: 500 });
  }
}
