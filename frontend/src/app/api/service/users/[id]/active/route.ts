import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SERVICE_KEY = process.env.SERVICE_API_KEY;

function requireServiceKey(request: NextRequest): NextResponse | null {
  if (!SERVICE_KEY) {
    return NextResponse.json({ message: 'Service API not configured' }, { status: 503 });
  }
  const key = request.headers.get('x-service-key');
  if (key !== SERVICE_KEY) {
    return NextResponse.json({ message: 'Invalid service key' }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const { active } = body;

  if (typeof active !== 'boolean') {
    return NextResponse.json({ message: 'Campo "active" (boolean) obrigatório' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { active },
  });

  return NextResponse.json({
    id: updated.id,
    nome: updated.name,
    email: updated.email,
    role: updated.role,
    active: updated.active,
  });
}
