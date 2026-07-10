const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');

function isEmptyOrDash(val) {
  if (val === undefined || val === null) return true;
  const s = String(val).trim();
  return s === '' || s.toLowerCase() === 'nan' || ['-', '—', '–', '小横杠'].includes(s);
}

function convertCars(excelPath) {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (json.length < 2) {
    throw new Error('展车文件为空或格式不正确');
  }

  const headers = json[0].map(h => String(h).trim());
  const getCol = (row, name) => {
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
    const apClean = isEmptyOrDash(ap) ? '' : ap;

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
      isDeleted: false,
      isLocked: false
    });
  }

  return cars;
}

function convertStores(excelPath) {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (json.length < 2) {
    throw new Error('门店文件为空或格式不正确');
  }

  const headers = json[0].map(h => String(h).trim());
  const getCol = (row, name) => {
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
      shortName: name.includes('|') ? name.split('|').pop().trim() : name,
      district: String(getCol(row, '归属行政片区') || ''),
    });
  }

  return stores;
}

// 主程序
const dataDir = path.join(__dirname, '..', 'data');
const carFile = path.join(dataDir, '展车列表.xlsx');
const storeFile = path.join(dataDir, '门店信息.xlsx');

console.log('📁 数据目录:', dataDir);
console.log('🔍 查找展车文件:', carFile);
console.log('🔍 查找门店文件:', storeFile);

let hasError = false;

try {
  if (fs.existsSync(carFile)) {
    const cars = convertCars(carFile);
    fs.writeFileSync(path.join(DATA_DIR, 'cars.json'), JSON.stringify(cars, null, 2));
    console.log('✅ 展车数据已转换:', cars.length, '辆');
  } else {
    console.log('⚠️ 未找到展车文件:', carFile);
    hasError = true;
  }

  if (fs.existsSync(storeFile)) {
    const stores = convertStores(storeFile);
    fs.writeFileSync(path.join(DATA_DIR, 'stores.json'), JSON.stringify(stores, null, 2));
    console.log('✅ 门店数据已转换:', stores.length, '家');
  } else {
    console.log('⚠️ 未找到门店文件:', storeFile);
    hasError = true;
  }

  if (!hasError) {
    console.log('\n🎉 转换完成！请执行以下命令推送到 GitHub：');
    console.log('   git add .');
    console.log('   git commit -m "更新展车数据"');
    console.log('   git push');
  }
} catch (err) {
  console.error('❌ 转换失败:', err.message);
  process.exit(1);
}
