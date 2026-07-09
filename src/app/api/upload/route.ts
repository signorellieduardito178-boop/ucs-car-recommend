import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Car } from '@/models/Car';
import { Store } from '@/models/Store';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get('admin-token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const formData = await req.formData();
    const carFile = formData.get('cars') as File | null;
    const storeFile = formData.get('stores') as File | null;
    const reset = formData.get('reset') === 'true';

    if (reset) {
      await Car.updateMany({}, { isDeleted: false, isLocked: false });
      return NextResponse.json({ success: true, message: '已重置所有车辆状态' });
    }

    let result: any = { cars: 0, stores: 0 };

    if (carFile) {
      const buffer = Buffer.from(await carFile.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (json.length < 2) {
        return NextResponse.json({ error: '展车文件为空或格式不正确' }, { status: 400 });
      }

      const headers = json[0].map((h: any) => String(h).trim());
      const getCol = (row: any[], name: string) => {
        const idx = headers.indexOf(name);
        return idx >= 0 ? row[idx] : '';
      };

      const cars = [];
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        const vin = String(getCol(row, 'VIN码') || '').trim();
        if (!vin) continue;

        const ap = String(getCol(row, '实际到达点位') || '');
        const pl = String(getCol(row, '物理库位') || '');
        const isEmptyOrDash = (v: string) => !v || v.toLowerCase() === 'nan' || ['-', '—', '–', '小横杠'].includes(v.trim());
        let apClean = isEmptyOrDash(ap) ? '' : ap;

        let pointType = '门店', pointPriority = 99;
        if (apClean.includes('交付中心')) { pointType = 'CDC'; pointPriority = 1; }
        else if (apClean.includes('运输中') || apClean.includes('3公里内')) { pointType = '运输中'; pointPriority = 3; }
        else if (apClean === '') {
          if (pl.includes('交付中心')) { pointType = 'CDC'; pointPriority = 1; }
          else if (pl.includes('FDC') || pl.includes('fdc')) { pointType = 'fdc'; pointPriority = 2; }
          else if (pl.includes('运输中')) { pointType = '运输中'; pointPriority = 3; }
          else { pointType = '小横杠'; pointPriority = 3; }
        }

        cars.push({
          vin,
          model: String(getCol(row, '车型') || ''),
          paint: String(getCol(row, '车漆') || ''),
          interior: String(getCol(row, '内饰主题') || ''),
          location: pl,
          actualPoint: ap,
          salesStatus: String(getCol(row, '销售状态') || ''),
          damageRecord: String(getCol(row, '质损车况记录') || ''),
          isDowngrade: String(getCol(row, '是否降级车') || ''),
          pointType,
          pointPriority,
        });
      }

      // 全量替换（保留已有审批记录相关的车辆状态）
      await Car.deleteMany({});
      await Car.insertMany(cars);
      result.cars = cars.length;
    }

    if (storeFile) {
      const buffer = Buffer.from(await storeFile.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (json.length < 2) {
        return NextResponse.json({ error: '门店文件为空或格式不正确' }, { status: 400 });
      }

      const headers = json[0].map((h: any) => String(h).trim());
      const getCol = (row: any[], name: string) => {
        const idx = headers.indexOf(name);
        return idx >= 0 ? row[idx] : '';
      };

      const stores = [];
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        const name = String(getCol(row, '门店') || '').trim();
        if (!name) continue;
        stores.push({
          name,
          shortName: name.includes('|') ? name.split('|').pop()!.trim() : name,
          district: String(getCol(row, '归属行政片区') || ''),
        });
      }

      await Store.deleteMany({});
      await Store.insertMany(stores);
      result.stores = stores.length;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
