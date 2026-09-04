interface ResetPasswordEmailParams {
  nome: string;
  link: string;
}

export function resetPasswordEmailHtml({ nome, link }: ResetPasswordEmailParams): string {
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
            <td bgcolor="#c2410c" style="background-color:#c2410c;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">AURORA EADI</p>
              <p style="margin:4px 0 0;color:#fff7ed;font-size:12px;font-weight:500;letter-spacing:2px;">MANAUS</p>
              <p style="margin:8px 0 0;color:#fff7ed;font-size:13px;font-weight:500;">Portal do Cliente</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#111827;font-size:16px;font-weight:600;">Olá, ${nome}!</p>

              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Portal do Cliente</strong> do recinto Aurora EADI.
              </p>

              <p style="margin:0 0 8px;color:#4b5563;font-size:14px;">
                Clique no botão abaixo para criar uma nova senha:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${link}" target="_blank" style="display:inline-block;background-color:#ea580c;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="${link}" style="color:#ea580c;word-break:break-all;">${link}</a>
              </p>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email — sua senha atual continua válida.
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
