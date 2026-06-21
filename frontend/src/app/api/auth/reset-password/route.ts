import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, newPassword } = await request.json();

    if (!accessToken || !newPassword) {
      return NextResponse.json({ message: 'Token e nova senha são obrigatórios' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: { user }, error: verifyError } = await supabase.auth.getUser(accessToken);

    if (verifyError || !user) {
      return NextResponse.json({ message: 'Token inválido ou expirado' }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Senha redefinida com sucesso' });
  } catch (error: any) {
    console.error('[ResetPassword]', error);
    return NextResponse.json({ message: 'Erro ao redefinir senha' }, { status: 500 });
  }
}
