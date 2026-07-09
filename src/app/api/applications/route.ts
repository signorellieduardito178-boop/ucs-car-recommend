import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { Car } from '@/models/Car';
import { verifyToken } from '@/lib/auth';

// 销售提交申请
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { vin, model, paint, interior, salesName, salesStore, targetStore, paintPref, interiorPref } = body;

    if (!vin || !salesName || !salesStore || !targetStore) {
      return NextResponse.json({ error: '缺少必要信息' }, { status: 400 });
    }

    // 检查车辆是否已被锁定或有待审批申请
    const existingPending = await Application.findOne({ vin, status: 'pending' });
    if (existingPending) {
      return NextResponse.json({ error: '该车辆已有待审批申请' }, { status: 400 });
    }

    const car = await Car.findOne({ vin });
    if (!car || car.isDeleted || car.isLocked) {
      return NextResponse.json({ error: '车辆不可用' }, { status: 400 });
    }

    // 锁定车辆
    await Car.updateOne({ vin }, { isLocked: true });

    const app = await Application.create({
      vin, model, paint, interior,
      salesName, salesStore, targetStore,
      paintPref, interiorPref,
      status: 'pending',
    });

    // 飞书推送（如果配置了）
    await sendFeishuNotification(salesName, salesStore, model, vin, targetStore);

    return NextResponse.json({ success: true, application: app });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 获取申请列表（管理员）
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get('admin-token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const filter: any = {};
    if (status) filter.status = status;

    const apps = await Application.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(apps);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 审批申请
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get('admin-token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, adminNote } = body;

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const app = await Application.findById(id);
    if (!app) {
      return NextResponse.json({ error: '申请不存在' }, { status: 404 });
    }

    app.status = status;
    app.adminNote = adminNote || '';
    await app.save();

    // 如果审批通过，标记车辆为已选用
    if (status === 'approved') {
      await Car.updateOne({ vin: app.vin }, { isDeleted: true, isLocked: false });
    }
    // 如果审批拒绝，解锁车辆
    if (status === 'rejected') {
      await Car.updateOne({ vin: app.vin }, { isLocked: false });
    }

    return NextResponse.json({ success: true, application: app });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendFeishuNotification(salesName: string, salesStore: string, model: string, vin: string, targetStore: string) {
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'text',
        content: {
          text: `🚗 新的展车申请\n销售: ${salesName} (${salesStore})\n车型: ${model}\n车架号: ${vin}\n目标门店: ${targetStore}\n请登录管理后台审批。`,
        },
      }),
    });
  } catch {
    // 静默失败，不影响主流程
  }
}
