const NOISE_WORDS = [
  "要","找","给","我","一辆","送到","去","来","台",
  "辆","的","是","在","到","送","弄","拿","帮","需要",
  "麻烦","一下","个","吧","吗","呢","啊"
];

const COLOR_MAP: Record<string, string[]> = {
  '白': ['白', '云白', '珍珠白', '星白', '雪', '黎空', '银辉白'],
  '黑': ['黑', '深空黑', '曜石黑', '墨黑'],
  '灰': ['灰', '阿尔卑斯灰', '远山灰', '星灰', '南极星灰', '月辉银灰'],
  '蓝': ['蓝', '宇航蓝', '同温层蓝', '南极星蓝'],
  '红': ['红', '火星红', '霞光'],
  '绿': ['绿', '极光绿', '苔原绿'],
  '金': ['金', '曙光金', '云霞金'],
  '银': ['银', '月辉银'],
  '棕': ['棕', '可可棕', '咖啡棕', '松果棕'],
  '橙': ['橙', '霞光橙'],
  '紫': ['紫', '星云紫'],
};

function isEmptyOrDash(val: any): boolean {
  if (val === undefined || val === null) return true;
  const s = String(val).trim();
  return s === '' || s.toLowerCase() === 'nan' || ['-','—','–','小横杠'].includes(s);
}

function classifyPoint(row: any): { type: string; priority: number; borrowable: boolean } {
  let ap = String(row.actualPoint || '');
  let pl = String(row.location || '');
  if (isEmptyOrDash(ap)) ap = '';
  if (isEmptyOrDash(pl)) pl = '';

  if (ap.includes('交付中心')) return { type: 'CDC', priority: 1, borrowable: true };
  if (ap.includes('运输中') || ap.includes('3公里内')) return { type: '运输中', priority: 3, borrowable: true };
  if (ap === '') {
    if (pl.includes('交付中心')) return { type: 'CDC', priority: 1, borrowable: true };
    if (pl.includes('FDC') || pl.includes('fdc')) return { type: 'fdc', priority: 2, borrowable: true };
    if (pl.includes('运输中')) return { type: '运输中', priority: 3, borrowable: true };
    return { type: '小横杠', priority: 3, borrowable: true };
  }
  return { type: '门店', priority: 99, borrowable: false };
}

function inferDistrict(loc: string): string {
  if (!loc) return '';
  const s = String(loc);
  if (s.includes('余杭') || s.includes('五常')) return '余杭区';
  if (s.includes('萧山')) return '萧山区';
  if (s.includes('西湖')) return '西湖区';
  if (s.includes('滨江')) return '滨江区';
  if (s.includes('上城') || s.includes('钱江新城') || s.includes('万象城') || s.includes('来福士')) return '上城区';
  if (s.includes('拱墅') || s.includes('绍兴路')) return '拱墅区';
  if (s.includes('临平')) return '临平区';
  if (s.includes('富阳')) return '富阳区';
  if (s.includes('临安')) return '临安区';
  if (s.includes('桐庐')) return '桐庐县';
  if (s.includes('建德')) return '建德市';
  if (s.includes('淳安')) return '淳安县';
  if (s.includes('湖州') || s.includes('吴兴') || s.includes('长兴') || s.includes('安吉') || s.includes('德清') || s.includes('南浔')) return '湖州市';
  if (s.includes('合肥')) return '合肥市';
  return '';
}

function extractColorCategory(text: string): string | null {
  const t = String(text).toLowerCase().replace(/\s/g, '');
  for (const [category, variants] of Object.entries(COLOR_MAP)) {
    if (variants.some(v => t.includes(v.toLowerCase().replace(/\s/g, '')))) {
      return category;
    }
  }
  return null;
}

export function fuzzyMatchConfig(actual: string, expected: string): boolean {
  const a = String(actual).toLowerCase().replace(/\s/g, '');
  const e = String(expected).toLowerCase().replace(/\s/g, '');
  if (a.includes(e) || e.includes(a)) return true;
  const aColor = extractColorCategory(a);
  const eColor = extractColorCategory(e);
  if (aColor && eColor && aColor === eColor) return true;
  return false;
}

function parseDemand(text: string, allModels: string[], stores: any[]) {
  const textClean = text.trim();
  const textUpper = textClean.toUpperCase().replace(/\s/g, '');

  let targetModel: string | null = null;
  const sortedModels = [...allModels].sort((a, b) => b.length - a.length);
  for (const model of sortedModels) {
    const pattern = model.toUpperCase().replace(/\s/g, '');
    if (textUpper.includes(pattern)) {
      targetModel = model;
      break;
    }
  }

  let textForStore = textClean;
  if (targetModel) {
    textForStore = textForStore.replace(targetModel, '').replace(targetModel.toUpperCase(), '').replace(targetModel.toLowerCase(), '');
  }
  for (const w of NOISE_WORDS) {
    textForStore = textForStore.replace(new RegExp(w, 'g'), '');
  }
  textForStore = textForStore.trim();

  let targetStore: string | null = null;
  let bestScore = -1;

  for (const srow of stores) {
    const fullName = String(srow.name || '').trim();
    if (!fullName) continue;
    let short = fullName.includes('|') ? fullName.split('|').pop()!.trim() : fullName.trim();
    const shortClean = short.replace(/\s/g, '').replace(/\u3000/g, '');
    const storeText = textForStore.replace(/\s/g, '').replace(/\u3000/g, '');

    let match = false;
    let score = 0;

    if (shortClean.includes(storeText) || storeText.includes(shortClean)) {
      match = true;
      score = shortClean.length;
    } else {
      const maxLen = Math.min(storeText.length, 8);
      for (let length = maxLen; length >= 2; length--) {
        for (let i = 0; i <= storeText.length - length; i++) {
          const fragment = storeText.substring(i, i + length);
          if (shortClean.includes(fragment)) {
            match = true;
            score = Math.max(score, length * 2);
            break;
          }
        }
        if (match) break;
      }
    }

    if (match) {
      if (fullName.includes('乐道')) score -= 100;
      if (fullName.includes('中心')) score += 10;
      if (score > bestScore) {
        bestScore = score;
        targetStore = fullName;
      }
    }
  }

  return { targetModel, targetStore };
}

export function runRecommendation(
  cars: any[],
  stores: any[],
  demandText: string,
  paintPref: string,
  interiorPref: string
) {
  const allModels = Array.from(new Set(cars.map(r => r.model).filter(Boolean))).sort((a: string, b: string) => b.length - a.length);
  const { targetModel, targetStore } = parseDemand(demandText, allModels, stores);

  if (!targetModel) {
    return { error: '未能识别车型，请尝试输入: ' + allModels.join(', ') };
  }
  if (!targetStore) {
    return { error: '未能识别门店，请检查门店名称' };
  }

  let statusOk = cars.filter(r => r.salesStatus === '可售' && r.damageRecord === '无质损' && !r.isDeleted && !r.isLocked);
  statusOk = statusOk.map(r => {
    const cp = classifyPoint(r);
    return { ...r, _pointType: cp.type, _pointPriority: cp.priority, _borrowable: cp.borrowable };
  }).filter(r => r._borrowable);

  let matched = statusOk.filter(r => r.model === targetModel);
  if (matched.length === 0) {
    return { error: '无可外借的 \'' + targetModel + '\' 展车' };
  }

  const storeMatch = stores.filter(s => s.name === targetStore);
  const targetDistrict = storeMatch.length > 0 ? String(storeMatch[0].district || '').trim() : '';
  matched = matched.map(r => {
    const carDistrict = inferDistrict(r.location);
    const sameDistrict = carDistrict === targetDistrict;
    return { ...r, _carDistrict: carDistrict, _sameDistrict: sameDistrict };
  });

  const preferences: Record<string, string> = {};
  if (paintPref && paintPref.trim()) preferences['车漆'] = paintPref.trim();
  if (interiorPref && interiorPref.trim()) preferences['内饰主题'] = interiorPref.trim();

  matched = matched.map(r => {
    let diffs: string[] = [];
    for (const [field, expected] of Object.entries(preferences)) {
      const actual = field === '车漆' ? r.paint : r.interior;
      if (!actual || isEmptyOrDash(actual)) {
        diffs.push(field + '缺失');
      } else if (!fuzzyMatchConfig(actual, expected)) {
        diffs.push(field + '不符(期望' + expected + '，实际' + actual + ')');
      }
    }
    return { ...r, _perfect: diffs.length === 0, _diffText: diffs.join('、') };
  });

  matched.sort((a: any, b: any) => {
    if (a._pointPriority !== b._pointPriority) return a._pointPriority - b._pointPriority;
    if (a._sameDistrict !== b._sameDistrict) return a._sameDistrict ? -1 : 1;
    if (a._perfect !== b._perfect) return a._perfect ? -1 : 1;
    return 0;
  });

  const perfect = matched.filter(r => r._perfect);
  const alternative = matched.filter(r => !r._perfect);

  return { targetModel, targetStore, perfect, alternative };
}
