import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface Mensagem {
  /** Aceita nulo/vazio porque email de cliente e despachante é opcional no schema. */
  para: (string | null | undefined)[];
  assunto: string;
  html: string;
  texto: string;
}

/**
 * Saída de email do portal, via Exchange Online (portal-cliente@auroraeadi.com.br).
 *
 * Regra central: `enviar` NUNCA lança. Notificação aqui é efeito colateral de
 * uma decisão já gravada — se o Office 365 estiver fora, aprovar uma procuração
 * não pode virar erro 500 e desfazer o trabalho do analista. O que falha vira
 * log, não exceção.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  private transporter: Transporter | null = null;

  private readonly remetente: string =
    process.env.SMTP_FROM ||
    'Portal Cliente Aurora EADI <portal-cliente@auroraeadi.com.br>';

  async onModuleInit() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Sem credencial o serviço fica desligado em vez de derrubar o boot: em dev
    // ninguém precisa de SMTP para subir a API, e `enviar` trata a ausência.
    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP não configurado (SMTP_HOST/SMTP_USER/SMTP_PASS) — notificações por email desativadas',
      );
      return;
    }

    const port = parseInt(process.env.SMTP_PORT || '587', 10);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      // No Office 365 a 587 é STARTTLS: a conexão abre em claro e sobe para TLS
      // no comando STARTTLS. `secure: true` vale só para a 465 (TLS implícito) —
      // ligá-lo na 587 trava o handshake até estourar o timeout.
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: true,
      auth: { user, pass },
    });

    try {
      await this.transporter.verify();
      this.logger.log(`SMTP pronto — ${user} via ${host}:${port}`);
    } catch (erro) {
      // Não zera o transporter: a caixa pode voltar depois (bloqueio de AUTH,
      // rede, manutenção da Microsoft) e cada envio tenta de novo por conta.
      this.logger.error(
        `SMTP não autenticou em ${host}:${port} — ${(erro as Error).message}`,
      );
    }
  }

  async enviar(msg: Mensagem): Promise<void> {
    // Dedup porque o mesmo endereço costuma aparecer duas vezes: o usuário que
    // enviou o documento é, com frequência, o email cadastrado no despachante.
    const para = [
      ...new Set(
        msg.para
          .filter((e): e is string => typeof e === 'string' && e.includes('@'))
          .map((e) => e.trim().toLowerCase()),
      ),
    ];

    if (!para.length) {
      this.logger.warn(
        `"${msg.assunto}" não enviado — nenhum destinatário com email cadastrado`,
      );
      return;
    }

    if (!this.transporter) {
      this.logger.warn(
        `"${msg.assunto}" não enviado para ${para.join(', ')} — SMTP desativado`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.remetente,
        to: para,
        subject: msg.assunto,
        text: msg.texto,
        html: msg.html,
      });
      this.logger.log(
        `Email "${msg.assunto}" enviado para ${para.join(', ')} (${info.messageId})`,
      );
    } catch (erro) {
      this.logger.error(
        `Falha ao enviar "${msg.assunto}" para ${para.join(', ')} — ${(erro as Error).message}`,
      );
    }
  }
}
