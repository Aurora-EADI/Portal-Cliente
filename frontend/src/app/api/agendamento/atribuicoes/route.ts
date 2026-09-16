import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { requireAuth, requireRoles } from '@/lib/auth-server';
import { normalizeCnpj, ensureTransportadoraConvite } from '@/lib/convites';

// Predicado de ownership da DI averbada pro usuário (CLIENTE por CNPJ, DESPACHANTE por código)
async function getDiOwnershipWhere(user: User): Promise<Record<string, any> | null> {
  if (user.role === UserRole.CLIENTE && user.clienteId) {
    const cliente = await prisma.cliente.findUnique({
      where: { id: user.clienteId },
      select: { cnpj: true },
    });
    if (!cliente?.cnpj) return null;
    return { cnpjCliente: cliente.cnpj };
  }
  if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
    const despachante = await prisma.despachante.findUnique({
      where: { id: user.despachanteId },
      select: { codDespachante: true },
    });
    if (!despachante) return null;
    return { codDespachante: despachante.codDespachante };
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const denied = requireRoles(user, [UserRole.CLIENTE, UserRole.DESPACHANTE]);
  if (denied) return denied;

  const ownership = await getDiOwnershipWhere(user);
  if (!ownership) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const nLote = searchParams.get('nLote');

  const atribuicoes = await prisma.diTransportadoraAtribuicao.findMany({
    where: {
      ...(nLote ? { nLote } : {}),
      diAverbada: ownership,
    },
    include: {
      transportadora: { select: { id: true, nome: true, cnpj: true } },
    },
    orderBy: { atribuidoEm: 'desc' },
  });

  return NextResponse.json(atribuicoes);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const denied = requireRoles(user, [UserRole.CLIENTE, UserRole.DESPACHANTE]);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { nLote, cnpj, nome, email, whatsapp } = body;
    const container = typeof body.container === 'string' ? body.container.trim() : '';

    if (!nLote || !cnpj) {
      return NextResponse.json({ message: 'nLote e cnpj são obrigatórios' }, { status: 400 });
    }

    const cnpjDigits = normalizeCnpj(String(cnpj));
    if (cnpjDigits.length !== 14) {
      return NextResponse.json({ message: 'CNPJ inválido (14 dígitos)' }, { status: 400 });
    }

    const ownership = await getDiOwnershipWhere(user);
    if (!ownership) {
      return NextResponse.json({ message: 'Usuário sem vínculo de cliente/despachante' }, { status: 403 });
    }

    const di = await prisma.diAverbada.findFirst({ where: { nLote, ...ownership } });
    if (!di) {
      return NextResponse.json({ message: 'DI não encontrada ou sem permissão' }, { status: 404 });
    }

    if (container) {
      const containersDaDi = (di.containers ?? '').split('/').map(c => c.trim()).filter(Boolean);
      if (!containersDaDi.includes(container)) {
        return NextResponse.json({ message: 'Container não pertence a esta DI' }, { status: 400 });
      }
    }

    let transportadora = await prisma.transportadoraConta.findUnique({ where: { cnpj: cnpjDigits } });
    if (!transportadora) {
      if (!nome) {
        return NextResponse.json({ message: 'nome é obrigatório para nova transportadora' }, { status: 400 });
      }
      transportadora = await prisma.transportadoraConta.create({
        data: { cnpj: cnpjDigits, nome, whatsapp: whatsapp || null },
      });
    } else if (whatsapp && whatsapp !== transportadora.whatsapp) {
      transportadora = await prisma.transportadoraConta.update({
        where: { id: transportadora.id },
        data: { whatsapp },
      });
      // WhatsApp acabou de ser cadastrado/alterado: atribuições antigas dessa
      // transportadora não devem disparar notificação retroativa, só a que
      // está sendo criada agora nesta requisição (ainda não existe, então
      // este update só afeta as que já existiam).
      await prisma.diTransportadoraAtribuicao.updateMany({
        where: { transportadoraContaId: transportadora.id, whatsappNotificadoEm: null },
        data: { whatsappNotificadoEm: new Date() },
      });
    }

    const existente = await prisma.diTransportadoraAtribuicao.findFirst({
      where: { nLote, container },
      include: { transportadora: { select: { nome: true } } },
    });
    if (existente) {
      const mesmaTransportadora = existente.transportadoraContaId === transportadora.id;
      const message = mesmaTransportadora
        ? (container ? 'Transportadora já atribuída a este container.' : 'Transportadora já atribuída a esta DI.')
        : (container
          ? `Este container já está atribuído a ${existente.transportadora.nome}. Remova a atribuição atual antes de trocar.`
          : `Esta DI já está atribuída a ${existente.transportadora.nome}. Remova a atribuição atual antes de trocar.`);
      return NextResponse.json({ message }, { status: 409 });
    }

    const convite = await ensureTransportadoraConvite(transportadora, email);

    const atribuicao = await prisma.diTransportadoraAtribuicao.create({
      data: {
        nLote,
        container,
        transportadoraContaId: transportadora.id,
        atribuidoPorUserId: user.id,
        atribuidoPorRole: user.role,
      },
      include: {
        transportadora: { select: { id: true, nome: true, cnpj: true } },
      },
    });

    return NextResponse.json({ ...atribuicao, convite }, { status: 201 });
  } catch (err: any) {
    console.error('[atribuicoes] POST error:', err?.message ?? err);
    return NextResponse.json({ message: 'Erro ao atribuir transportadora' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const denied = requireRoles(user, [UserRole.CLIENTE, UserRole.DESPACHANTE]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const nLote = searchParams.get('nLote');
  const transportadoraContaId = searchParams.get('transportadoraContaId');
  const container = searchParams.get('container') ?? undefined;

  if (!nLote || !transportadoraContaId) {
    return NextResponse.json({ message: 'nLote e transportadoraContaId são obrigatórios' }, { status: 400 });
  }

  const ownership = await getDiOwnershipWhere(user);
  if (!ownership) {
    return NextResponse.json({ message: 'Usuário sem vínculo de cliente/despachante' }, { status: 403 });
  }

  const di = await prisma.diAverbada.findFirst({ where: { nLote, ...ownership } });
  if (!di) {
    return NextResponse.json({ message: 'DI não encontrada ou sem permissão' }, { status: 404 });
  }

  const deleted = await prisma.diTransportadoraAtribuicao.deleteMany({
    where: { nLote, transportadoraContaId, ...(container !== undefined ? { container } : {}) },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ message: 'Atribuição não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Atribuição removida' });
}
