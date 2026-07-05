import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { requireAuth, requireRoles } from '@/lib/auth-server';
import { createConviteRegistro, normalizeCnpj } from '@/lib/convites';

// Convite de transportadora enviado por CLIENTE ou DESPACHANTE logado
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const roleError = requireRoles(user, [UserRole.CLIENTE, UserRole.DESPACHANTE]);
  if (roleError) return roleError;

  try {
    const body = await request.json();
    const { cnpj, nome, email, diasValidade } = body;

    if (!cnpj || !nome) {
      return NextResponse.json({ message: 'cnpj e nome são obrigatórios' }, { status: 400 });
    }

    const cnpjDigits = normalizeCnpj(String(cnpj));
    if (cnpjDigits.length !== 14) {
      return NextResponse.json({ message: 'CNPJ inválido (14 dígitos)' }, { status: 400 });
    }

    const existente = await prisma.transportadoraConta.findUnique({
      where: { cnpj: cnpjDigits },
      include: { users: { where: { active: true }, select: { id: true } } },
    });
    if (existente && existente.users.length > 0) {
      return NextResponse.json(
        {
          message: 'Transportadora já cadastrada no portal. Você pode atribuí-la diretamente às suas DIs.',
          transportadoraContaId: existente.id,
          jaCadastrada: true,
        },
        { status: 409 },
      );
    }

    const { convite, link, emailSent } = await createConviteRegistro({
      tipo: UserRole.TRANSPORTADORA,
      nome,
      email,
      diasValidade,
      cnpjTransportadora: cnpjDigits,
    });

    return NextResponse.json(
      {
        id: convite.id,
        token: convite.token,
        link,
        nome: convite.nome,
        tipo: convite.tipo,
        expiresAt: convite.expiresAt.toISOString(),
        emailSent,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[convites-transportadora] POST error:', err?.message ?? err);
    return NextResponse.json({ message: 'Erro ao gerar convite' }, { status: 500 });
  }
}
