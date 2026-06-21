import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, senha, token } = body;

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: nome, email, senha' },
        { status: 400 },
      );
    }

    if (senha.length < 6) {
      return NextResponse.json({ message: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'E-mail já cadastrado' }, { status: 409 });
    }

    if (token) {
      return registerWithToken(body);
    }

    return NextResponse.json(
      { message: 'Token de convite obrigatório. Solicite um convite ao recinto Aurora EADI.' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('[Register]', error);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}

async function registerWithToken(body: any) {
  const { nome, email, senha, token, telefone } = body;

  const convite = await prisma.conviteRegistro.findUnique({ where: { token } });

  if (!convite) {
    return NextResponse.json({ message: 'Convite não encontrado' }, { status: 400 });
  }

  if (convite.usedAt) {
    return NextResponse.json({ message: 'Este convite já foi utilizado' }, { status: 400 });
  }

  if (convite.expiresAt < new Date()) {
    return NextResponse.json({ message: 'Este convite expirou. Solicite um novo convite.' }, { status: 400 });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      return NextResponse.json({ message: 'E-mail já registrado no sistema de autenticação' }, { status: 409 });
    }
    return NextResponse.json({ message: authError.message }, { status: 400 });
  }

  let clienteId: string | null = null;
  let despachanteId: string | null = null;

  if (convite.tipo === UserRole.DESPACHANTE && convite.codDespachante) {
    let despachante = await prisma.despachante.findUnique({
      where: { codDespachante: convite.codDespachante },
    });
    if (!despachante) {
      despachante = await prisma.despachante.create({
        data: {
          codDespachante: convite.codDespachante,
          nome: convite.nome,
          email,
          telefone: telefone || null,
        },
      });
    } else if (!despachante.email) {
      await prisma.despachante.update({
        where: { id: despachante.id },
        data: { email, telefone: telefone || undefined },
      });
    }
    despachanteId = despachante.id;
  }

  if (convite.tipo === UserRole.CLIENTE && convite.cnpjCliente) {
    let cliente = await prisma.cliente.findFirst({
      where: { cnpj: convite.cnpjCliente },
    });
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nome: convite.nome,
          cnpj: convite.cnpjCliente,
          email,
          telefone: telefone || null,
        },
      });
    }
    clienteId = cliente.id;
  }

  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      name: nome.trim(),
      email,
      role: convite.tipo,
      active: true,
      clienteId,
      despachanteId,
    },
  });

  await prisma.conviteRegistro.update({
    where: { id: convite.id },
    data: { usedAt: new Date(), usedByUserId: user.id },
  });

  return NextResponse.json({
    message: 'Cadastro realizado com sucesso',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }, { status: 201 });
}
