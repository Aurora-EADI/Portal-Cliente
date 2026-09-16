import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { resetPasswordEmailHtml } from '@/lib/emails/reset-password-template';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'E-mail é obrigatório' }, { status: 400 });
    }

    const genericResponse = NextResponse.json({
      message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
    });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return genericResponse;
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const resetToken = await prisma.passwordResetToken.create({
      data: { userId: user.id, expiresAt },
    });

    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${portalUrl}/auth/reset-password?token=${resetToken.token}`;

    if (resend) {
      const testOverride = process.env.RESEND_TEST_OVERRIDE_EMAIL;
      const to = testOverride || email;
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Aurora EADI <onboarding@resend.dev>',
        to,
        subject: 'Redefinição de senha — Portal do Cliente Aurora EADI',
        html: resetPasswordEmailHtml({ nome: user.name, link }),
      }).catch((err: any) => {
        console.error('[Resend] Password reset email error:', err?.message ?? err);
      });
    }

    return genericResponse;
  } catch (error: any) {
    console.error('[ForgotPassword]', error);
    return NextResponse.json({ message: 'Erro ao processar solicitação' }, { status: 500 });
  }
}
