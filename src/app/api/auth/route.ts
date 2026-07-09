import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

const ADMIN_USER = '3240102091';
const ADMIN_PASS = 'qiao6789786123';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = signToken({ username, role: 'admin' });
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7天
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin-token');
  return response;
}
