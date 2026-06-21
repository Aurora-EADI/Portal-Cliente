import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { conviteEmailHtml } from '@/lib/emails/convite-template';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

export async function POST(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { tipo, codDespachante, cnpjCliente, nome, email, diasValidade } = body;

    if (!tipo || !nome) {
      return NextResponse.json({ message: 'tipo and nome are required' }, { status: 400 });
    }

    const ALLOWED_TIPOS = ['DESPACHANTE', 'CLIENTE'];
    if (!ALLOWED_TIPOS.includes(tipo)) {
      return NextResponse.json({ message: `tipo inválido. Permitidos: ${ALLOWED_TIPOS.join(', ')}` }, { status: 400 });
    }

    if (tipo === 'DESPACHANTE' && !codDespachante) {
      return NextResponse.json({ message: 'codDespachante required for DESPACHANTE' }, { status: 400 });
    }

    if (tipo === 'CLIENTE' && !cnpjCliente) {
      return NextResponse.json({ message: 'cnpjCliente required for CLIENTE' }, { status: 400 });
    }

    const days = diasValidade ?? 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const convite = await prisma.conviteRegistro.create({
      data: {
        tipo: tipo as UserRole,
        codDespachante: codDespachante ? String(codDespachante) : null,
        cnpjCliente: cnpjCliente ?? null,
        nome,
        email: email ?? null,
        expiresAt,
      },
    });

    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${portalUrl}/registro?token=${convite.token}`;

    let emailSent = false;
    if (email && resend) {
      resend.emails.send({
        from: 'Aurora EADI <onboarding@resend.dev>',
        to: email,
        subject: 'Convite — Portal do Cliente Aurora EADI',
        html: conviteEmailHtml({ nome, tipo, link, diasValidade: days }),
      }).then(() => {
        console.log(`[Resend] Email sent to ${email}`);
      }).catch((err: any) => {
        console.error('[Resend] Email error:', err?.message ?? err);
      });
      emailSent = true;
    }

    return NextResponse.json({
      id: convite.id,
      token: convite.token,
      link,
      nome: convite.nome,
      tipo: convite.tipo,
      expiresAt: convite.expiresAt.toISOString(),
      emailSent,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[service/convites] POST error:', error.message);
    return NextResponse.json({ message: 'Failed to create invite' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const convites = await prisma.conviteRegistro.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({
    data: convites.map(c => ({
      ...c,
      expired: c.expiresAt < new Date(),
      used: !!c.usedAt,
    })),
    total: convites.length,
  });
}
