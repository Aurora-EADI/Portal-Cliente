import { Resend } from 'resend';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import { conviteEmailHtml } from './emails/convite-template';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export interface CreateConviteParams {
  tipo: UserRole;
  nome: string;
  email?: string | null;
  diasValidade?: number;
  codDespachante?: string | null;
  cnpjCliente?: string | null;
  cnpjTransportadora?: string | null;
  codTransp?: string | null;
}

export async function createConviteRegistro(params: CreateConviteParams) {
  const { tipo, nome, email, diasValidade, codDespachante, cnpjCliente, cnpjTransportadora, codTransp } = params;

  const days = diasValidade ?? 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const convite = await prisma.conviteRegistro.create({
    data: {
      tipo,
      codDespachante: codDespachante ? String(codDespachante) : null,
      cnpjCliente: cnpjCliente ?? null,
      cnpjTransportadora: cnpjTransportadora ? normalizeCnpj(cnpjTransportadora) : null,
      codTransp: codTransp ? String(codTransp) : null,
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
      from: process.env.RESEND_FROM_EMAIL || 'Aurora EADI <onboarding@resend.dev>',
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

  return { convite, link, emailSent };
}
