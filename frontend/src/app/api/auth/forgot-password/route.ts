import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'E-mail é obrigatório' }, { status: 400 });
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('[ForgotPassword]', error.message);
    }

    return NextResponse.json({
      message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
    });
  } catch (error: any) {
    console.error('[ForgotPassword]', error);
    return NextResponse.json({ message: 'Erro ao processar solicitação' }, { status: 500 });
  }
}
