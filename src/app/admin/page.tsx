'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'pending' | 'history'>('pending');
  const [carFile, setCarFile] = useState<File | null>(null);
  const [storeFile, setStoreFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  // 检查登录状态
  useEffect(() => {
    fetch('/api/applications').then(r => {
      if (r.status === 401) { setIsLogin(false); setChecking(false); }
      else { setIsLogin(true); setChecking(false); loadApps('pending'); }
    }).catch(() => { setIsLogin(false); setChecking(false); });
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      setIsLogin(true);
      loadApps('pending');
    } else {
      setLoginErr('用户名或密码错误');
    }
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    setIsLogin(false);
  }

  async function upload() {
    setUploadMsg('');
    if (!carFile && !storeFile) { setUploadMsg('请至少选择一个文件'); return; }
    const form = new FormData();
    if (carFile) form.append('cars', carFile);
    if (storeFile) form.append('stores', storeFile);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.success) {
      setUploadMsg(`✅ 上传成功！展车 ${data.cars || 0} 辆，门店 ${data.stores || 0} 家`);
      setCarFile(null); setStoreFile(null);
    } else {
      setUploadMsg('❌ ' + (data.error || '上传失败'));
    }
  }

  async function resetAll() {
    if (!confirm('确定要重置所有车辆状态吗？所有已选用标记将被清除。')) return;
    setUploadMsg('');
    const form = new FormData();
    form.append('reset', 'true');
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    setUploadMsg(data.success ? '✅ ' + data.message : '❌ 重置失败');
  }

  const loadApps = useCallback(async (status: string) => {
    setLoading(true);
    const res = await fetch(`/api/applications?status=${status}`);
    if (res.ok) {
      const data = await res.json();
      setApps(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLogin && (activeTab === 'pending' || activeTab === 'history')) {
      const s = activeTab === 'pending' ? 'pending' : '';
      loadApps(s);
      if (activeTab === 'pending') {
        const iv = setInterval(() => loadApps('pending'), 10000);
        return () => clearInterval(iv);
      }
    }
  }, [activeTab, isLogin, loadApps]);

  async function decide(id: string, status: 'approved' | 'rejected') {
    const res = await fetch('/api/applications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, adminNote: note }),
    });
    if (res.ok) {
      setNote('');
      loadApps(activeTab === 'pending' ? 'pending' : '');
    }
  }

  if (checking) return <div className="text-center py-20 text-gray-500">加载中...</div>;

  if (!isLogin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 text-center mb-6">🔐 管理员登录</h1>
          <form onSubmit={login}>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">用户名</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required />
            </div>
            {loginErr && <div className="mb-3 text-red-500 text-sm">{loginErr}</div>}
            <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">登录</button>
          </form>
          <a href="/" className="block text-center text-blue-400 text-sm mt-4 hover:underline">← 返回销售端</a>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">⚙️ 管理后台</h1>
        <button onClick={logout} className="text-sm text-red-500 hover:underline">退出登录</button>
      </header>

      {/* Tab */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'pending', label: `⏳ 待审批 ${activeTab === 'pending' && apps.filter(a => a.status === 'pending').length > 0 ? `(${apps.filter(a => a.status === 'pending').length})` : ''}` },
          { key: 'history', label: '📋 审批历史' },
          { key: 'upload', label: '📁 数据管理' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 待审批 */}
      {activeTab === 'pending' && (
        <section>
          {loading ? <div className="text-center py-8 text-gray-400">加载中...</div> :
           apps.filter(a => a.status === 'pending').length === 0 ? <div className="text-center py-8 text-gray-400">暂无待审批申请</div> :
           apps.filter(a => a.status === 'pending').map((app: any) => (
            <div key={app._id} className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{app.salesName} ({app.salesStore})</div>
                  <div className="text-sm text-gray-600 mt-1 space-x-3">
                    <span>车型: {app.model}</span>
                    <span>车架号: {app.vin}</span>
                    <span>目标门店: {app.targetStore}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    车漆: {app.paint || '无'} | 内饰: {app.interior || '无'}
                    {app.paintPref && <span className="ml-2">偏好: {app.paintPref}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">申请时间: {new Date(app.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3">
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="审批备注（可选）" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none mb-2" rows={2} />
                <div className="flex gap-2">
                  <button onClick={() => decide(app._id, 'approved')} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">✅ 同意</button>
                  <button onClick={() => decide(app._id, 'rejected')} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">❌ 否决</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 审批历史 */}
      {activeTab === 'history' && (
        <section>
          {loading ? <div className="text-center py-8 text-gray-400">加载中...</div> :
           apps.length === 0 ? <div className="text-center py-8 text-gray-400">暂无审批记录</div> :
           apps.map((app: any) => (
            <div key={app._id} className={`bg-white rounded-xl p-4 shadow-sm mb-3 border-l-4 ${app.status === 'approved' ? 'border-green-500' : app.status === 'rejected' ? 'border-red-500' : 'border-yellow-500'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-800">{app.salesName} ({app.salesStore}) — {app.model}</div>
                  <div className="text-sm text-gray-500">{app.vin} → {app.targetStore}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {app.status === 'approved' ? '✅ 已通过' : app.status === 'rejected' ? '❌ 已否决' : '⏳ 待审批'}
                    {app.adminNote && <span className="ml-2">备注: {app.adminNote}</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 数据上传 */}
      {activeTab === 'upload' && (
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">📁 上传数据</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">展车列表 (Excel)</label>
              <input type="file" accept=".xlsx,.xls" onChange={e => setCarFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              {carFile && <p className="text-xs text-green-600 mt-1">已选择: {carFile.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">门店信息 (Excel)</label>
              <input type="file" accept=".xlsx,.xls" onChange={e => setStoreFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              {storeFile && <p className="text-xs text-green-600 mt-1">已选择: {storeFile.name}</p>}
            </div>
          </div>
          <button onClick={upload} className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 mb-3">上传并更新</button>
          <button onClick={resetAll} className="ml-3 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">↩️ 重置所有车辆状态</button>
          {uploadMsg && <div className={`mt-3 p-3 rounded-lg text-sm ${uploadMsg.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{uploadMsg}</div>}
        </section>
      )}
    </main>
  );
}
