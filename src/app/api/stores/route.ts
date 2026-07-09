import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Store } from '@/models/Store';

export async function GET() {
  try {
    await connectDB();
    const stores = await Store.find().lean();
    return NextResponse.json(stores);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
