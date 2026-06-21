interface ConviteEmailParams {
  nome: string;
  tipo: string;
  link: string;
  diasValidade: number;
}

export function conviteEmailHtml({ nome, tipo, link, diasValidade }: ConviteEmailParams): string {
  const tipoLabel = tipo === 'DESPACHANTE' ? 'Despachante' : 'Cliente';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #c2410c 0%, #f97316 100%);padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.2);border-radius:10px;padding:8px 14px;">
                    <span style="color:#ffffff;font-size:24px;font-weight:800;font-style:italic;letter-spacing:1px;">AE</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">AURORA EADI</span><br>
                    <span style="color:#fff7ed;font-size:12px;font-weight:500;letter-spacing:2px;">MANAUS</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#fff7ed;font-size:13px;font-weight:500;">Portal do Cliente</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#111827;font-size:16px;font-weight:600;">Olá, ${nome}!</p>

              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.6;">
                Você foi convidado(a) a se cadastrar no <strong>Portal do Cliente</strong> do recinto Aurora EADI como <strong>${tipoLabel}</strong>.
              </p>

              <p style="margin:0 0 8px;color:#4b5563;font-size:14px;">
                Clique no botão abaixo para criar sua conta:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${link}" target="_blank" style="display:inline-block;background-color:#ea580c;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
                      Criar minha conta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;margin:24px 0 0;">
                <p style="margin:0;color:#9a3412;font-size:13px;">
                  ⏳ Este convite expira em <strong>${diasValidade} dia${diasValidade > 1 ? 's' : ''}</strong>.
                </p>
              </div>

              <!-- Fallback link -->
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="${link}" style="color:#ea580c;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                Este email foi enviado automaticamente pelo sistema Aurora EADI.<br>
                Se você não solicitou este convite, ignore este email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
