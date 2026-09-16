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

    const UM_DIA_EM_SEGUNDOS = 24 * 60 * 60;

    const response = NextResponse.json({
      user: safeUser,
      token,
      expires_at: new Date(Date.now() + UM_DIA_EM_SEGUNDOS * 1000).toISOString(),
    });

    /**
     * O cookie também é emitido pelo servidor, e não só pelo `Cookies.set` do
     * client (services/api.ts).
     *
     * O motivo é que document.cookie não consegue sobrescrever um cookie
     * httpOnly de mesmo nome: quando um sobra no navegador — de outra versão
     * do portal, de outra branch, de um ambiente antigo — o `Cookies.set`
     * falha em silêncio, o `Cookies.get` do AuthContext continua sem enxergar
     * nada, e o usuário volta para a tela de login sem explicação. Só um
     * Set-Cookie do servidor substitui um httpOnly.
     *
     * httpOnly fica falso de propósito: o AuthContext lê este cookie por
     * JavaScript. Trocar isso é mudança de arquitetura de sessão, não correção
     * de bug.
     */
    response.cookies.set('access_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: UM_DIA_EM_SEGUNDOS,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('[Login]', error);
    return NextResponse.json({ message: 'Erro ao autenticar' }, { status: 500 });
  }
}
