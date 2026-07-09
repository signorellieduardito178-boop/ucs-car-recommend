import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Car } from '@/models/Car';
import { Store } from '@/models/Store';
import { runRecommendation } from '@/lib/carLogic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const demand = searchParams.get('demand') || '';
    const paint = searchParams.get('paint') || '';
    const interior = searchParams.get('interior') || '';

    if (!demand) {
      return NextResponse.json({ error: '请输入需求' }, { status: 400 });
    }

    const cars = await Car.find({ isDeleted: false, isLocked: false }).lean();
    const stores = await Store.find().lean();

    const result = runRecommendation(cars, stores, demand, paint, interior);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      targetModel: result.targetModel,
      targetStore: result.targetStore,
      perfect: result.perfect,
      alternative: result.alternative,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
