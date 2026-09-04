import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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

  const passwordHash = await bcrypt.hash(senha, 10);

  let clienteId: string | null = null;
  let despachanteId: string | null = null;
  let transportadoraContaId: string | null = null;

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

  if (convite.tipo === UserRole.TRANSPORTADORA && convite.cnpjTransportadora) {
    let transportadoraConta = await prisma.transportadoraConta.findUnique({
      where: { cnpj: convite.cnpjTransportadora },
    });
    if (!transportadoraConta) {
      transportadoraConta = await prisma.transportadoraConta.create({
        data: {
          cnpj: convite.cnpjTransportadora,
          nome: convite.nome,
          codTransp: convite.codTransp,
          email,
          telefone: telefone || null,
        },
      });
    } else if (!transportadoraConta.email || !transportadoraConta.codTransp) {
      transportadoraConta = await prisma.transportadoraConta.update({
        where: { id: transportadoraConta.id },
        data: {
          email: transportadoraConta.email ?? email,
          codTransp: transportadoraConta.codTransp ?? convite.codTransp,
        },
      });
    }
    transportadoraContaId = transportadoraConta.id;
  }

  const user = await prisma.user.create({
    data: {
      name: nome.trim(),
      email,
      password: passwordHash,
      role: convite.tipo,
      active: true,
      clienteId,
      despachanteId,
      transportadoraContaId,
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
