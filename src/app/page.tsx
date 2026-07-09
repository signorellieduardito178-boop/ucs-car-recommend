'use client';

import { useState } from 'react';

export default function HomePage() {
  const [salesName, setSalesName] = useState('');
  const [salesStore, setSalesStore] = useState('');
  const [demand, setDemand] = useState('');
  const [paintPref, setPaintPref] = useState('');
  const [interiorPref, setInteriorPref] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [applyMsg, setApplyMsg] = useState('');

  async function search() {
    if (!salesName || !salesStore) { setError('请先填写姓名和所在门店'); return; }
    if (!demand) { setError('请输入需求'); return; }
    setLoading(true); setError(''); setResult(null); setApplyMsg('');
    try {
      const res = await fetch(`/api/cars?demand=${encodeURIComponent(demand)}&paint=${encodeURIComponent(paintPref)}&interior=${encodeURIComponent(interiorPref)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setResult(data); }
    } catch { setError('搜索失败，请稍后重试'); }
    setLoading(false);
  }

  async function apply(car: any) {
    setApplyMsg('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin: car.vin,
          model: car.model,
          paint: car.paint,
          interior: car.interior,
          salesName,
          salesStore,
          targetStore: result?.targetStore,
          paintPref,
          interiorPref,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApplyMsg(`✅ 申请已提交！车架号 ${car.vin}，请等待管理员审批。`);
        // 从结果中移除该车辆
        setResult((prev: any) => ({
          ...prev,
          perfect: prev.perfect.filter((c: any) => c.vin !== car.vin),
          alternative: prev.alternative.filter((c: any) => c.vin !== car.vin),
        }));
      } else {
        setApplyMsg('❌ ' + (data.error || '提交失败'));
      }
    } catch { setApplyMsg('❌ 网络错误，请重试'); }
  }

  function renderCard(car: any, isPerfect: boolean) {
    const actualPointDisplay = !car.actualPoint || ['-', '—', '–', '小横杠', 'nan', ''].includes(String(car.actualPoint).trim()) ? '小横杠' : car.actualPoint;
    const districtTag = car._sameDistrict
      ? <span className="inline-block px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium">同区</span>
      : <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">跨区</span>;
    const pointTag = car._pointType === 'CDC'
      ? <span className="inline-block px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium">CDC</span>
      : car._pointType === '运输中'
      ? <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">运输中</span>
      : <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded text-xs font-medium">{car._pointType}</span>;

    return (
      <div key={car.vin} className={`bg-gray-50 rounded-lg p-4 mb-3 border-l-4 ${isPerfect ? 'border-green-500' : 'border-yellow-500'}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-semibold text-gray-800 text-base">{car.vin}{car.isDowngrade === '降级车' ? <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-500 rounded text-xs">降级车</span> : null}</div>
            <div className="text-sm text-gray-600 mt-1 space-x-3">
              <span>🎨 车漆: {car.paint || '无'}</span>
              <span>🛋️ 内饰: {car.interior || '无'}</span>
              <span>📍 实际到达: {actualPointDisplay}</span>
            </div>
            <div className="mt-2 space-x-2">{pointTag} {districtTag} {car._diffText ? <span className="text-yellow-600 text-sm">⚠️ 差异: {car._diffText}</span> : null}</div>
          </div>
          <button onClick={() => apply(car)} className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 whitespace-nowrap">申请借用</button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">🚗 UCS展车外借推荐系统</h1>
        <p className="text-gray-500 mt-1">销售自助检索平台</p>
      </header>

      {/* 销售信息 */}
      <section className="bg-white rounded-xl p-5 shadow-sm mb-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">👤 销售信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
            <input type="text" value={salesName} onChange={e => setSalesName(e.target.value)} placeholder="请输入姓名" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">所在门店</label>
            <input type="text" value={salesStore} onChange={e => setSalesStore(e.target.value)} placeholder="例如：城北万象城" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
        </div>
      </section>

      {/* 需求输入 */}
      <section className="bg-white rounded-xl p-5 shadow-sm mb-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">📝 需求输入</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">自然语言需求</label>
          <input type="text" value={demand} onChange={e => setDemand(e.target.value)} placeholder="例如：城北万象城要一辆es8" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          <p className="text-xs text-gray-400 mt-1">系统会自动解析车型和门店</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">车漆偏好（可选，支持模糊匹配）</label>
            <input type="text" value={paintPref} onChange={e => setPaintPref(e.target.value)} placeholder="例如：白色、灰色" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">内饰偏好（可选，支持模糊匹配）</label>
            <input type="text" value={interiorPref} onChange={e => setInteriorPref(e.target.value)} placeholder="例如：灰色、棕色" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
        </div>
        <button onClick={search} disabled={loading} className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300">
          {loading ? '⏳ 搜索中...' : '🔍 获取推荐'}
        </button>
      </section>

      {/* 结果区域 */}
      {(error || result || applyMsg) && (
        <section className="bg-white rounded-xl p-5 shadow-sm mb-5">
          {error && <div className="p-3 bg-red-50 text-red-500 rounded-lg mb-3">❌ {error}</div>}
          {applyMsg && <div className={`p-3 rounded-lg mb-3 ${applyMsg.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{applyMsg}</div>}
          {result && (
            <>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mb-4">📍 解析结果：车型 <strong>{result.targetModel}</strong> | 门店 <strong>{result.targetStore}</strong></div>
              {result.perfect?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">✅ 优先推荐 - 共 {result.perfect.length} 辆</h3>
                  {result.perfect.map((car: any) => renderCard(car, true))}
                </div>
              )}
              {result.alternative?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">⚠️ 备选推荐 - 共 {result.alternative.length} 辆</h3>
                  {result.alternative.map((car: any) => renderCard(car, false))}
                </div>
              )}
              {result.perfect?.length === 0 && result.alternative?.length === 0 && (
                <div className="text-gray-500 text-center py-4">无可外借的展车</div>
              )}
            </>
          )}
        </section>
      )}

      <footer className="text-center text-gray-400 text-sm py-4">
        <a href="/admin" className="text-blue-400 hover:underline">→ 管理员入口</a>
        <p className="mt-1">UCS展车外借推荐系统</p>
      </footer>
    </main>
  );
}
