export default function AdminPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ 管理后台</h1>
        <p className="text-gray-500 mt-1">展车数据更新说明</p>
      </header>

      <section className="bg-white rounded-xl p-5 shadow-sm mb-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">📁 数据更新流程</h2>
        <div className="text-gray-600 text-sm leading-7 space-y-2">
          <p><strong>1.</strong> 从系统导出最新的展车列表 Excel 和门店信息 Excel</p>
          <p><strong>2.</strong> 将 Excel 文件放到项目目录的 <code>data/</code> 文件夹中</p>
          <p><strong>3.</strong> 双击运行 <code>scripts/convert-excel.bat</code> 脚本，自动转换为 JSON</p>
          <p><strong>4.</strong> 执行以下命令推送到 GitHub：</p>
          <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">git add .
git commit -m "更新展车数据：2024-07-09"
git push</pre>
          <p><strong>5.</strong> Cloudflare Pages 自动检测变更并重新部署（约 1-2 分钟）</p>
          <p><strong>6.</strong> 销售刷新网页即可看到最新数据</p>
        </div>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm mb-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">📋 Excel 文件格式要求</h2>
        <div className="text-gray-600 text-sm leading-7">
          <p className="font-medium mb-2">展车列表 Excel 必须包含以下列：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>VIN码（唯一标识）</li>
            <li>车型</li>
            <li>车漆</li>
            <li>内饰主题</li>
            <li>物理库位</li>
            <li>实际到达点位</li>
            <li>销售状态（可售/不可售）</li>
            <li>质损车况记录（无质损/有质损）</li>
            <li>是否降级车</li>
          </ul>
          <p className="font-medium mt-4 mb-2">门店信息 Excel 必须包含以下列：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>门店（全称）</li>
            <li>归属行政片区</li>
          </ul>
        </div>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">🔗 相关链接</h2>
        <div className="text-sm space-y-2">
          <p><a href="/" className="text-blue-500 hover:underline">← 返回销售检索页面</a></p>
          <p><a href="https://nio.feishu.cn/base/TsRYbAqK9acrqDsrcCEcNWIHnOd?table=tbld4aTdeDbli8j5&view=vewVqFCrI3" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">打开飞书多维表 →</a></p>
        </div>
      </section>
    </main>
  );
}
