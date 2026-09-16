import * as nodemailer from 'nodemailer';

type BetterAuthEmail = {
  to: string;
  name: string;
  token: string;
  kind: 'password-reset';
};

export async function sendBetterAuthEmail(message: BetterAuthEmail): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('SMTP não configurado; e-mail Better Auth não enviado.');
    return;
  }

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const link = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(message.token)}`;
  const subject = 'Redefinição de senha — Portal do Cliente Aurora EADI';

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Portal Cliente Aurora EADI <portal-cliente@auroraeadi.com.br>',
    to: message.to,
    subject,
    text: `Olá, ${message.name}. Use este link para redefinir sua senha: ${link}`,
    html: `<p>Olá, ${message.name}.</p><p><a href="${link}">Redefinir senha</a></p>`,
  });
}
