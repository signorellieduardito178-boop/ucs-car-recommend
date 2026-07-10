# UCS展车外借推荐系统 — 轻量版

> 纯静态网站，无需后端服务器，数据通过 JSON 文件管理，部署到 Cloudflare Pages（国内访问快）。

## 系统架构

```
销售打开网站 → 填写信息 → 获取推荐 → 选中车辆 → 复制信息/跳转飞书多维表申请
                                    ↑
                                   数据来自 JSON 文件
                                    ↑
管理员每日更新：Excel → 本地脚本 → JSON → Git Push → 自动部署
```

## 使用方式

### 销售（Fellow）

1. 打开网站（管理员会提供链接）
2. 填写**姓名**和**所在门店**
3. 输入需求，例如：`城北万象城要一辆es8，白色`
4. 点击「获取推荐」
5. 在结果中选中合适的车辆，点击「📋 复制信息」或「去飞书申请」
6. 在飞书多维表中粘贴信息并提交申请
7. 等待管理员审批（飞书会自动推送消息）

### 管理员（你）

#### 日常更新数据（每天 1 次）

1. 从系统导出展车列表 Excel 和门店信息 Excel
2. 将 Excel 放到项目 `data/` 目录：
   - `data/展车列表.xlsx`
   - `data/门店信息.xlsx`
3. 双击运行 `scripts/convert-excel.bat`
4. 按提示选择是否推送到 GitHub
5. 1-2 分钟后网站自动更新

#### 手动更新（命令行）

```bash
cd ucs-car-recommend

# 将 Excel 放到 data/ 目录后
npm install                    # 首次运行
npm run convert               # 转换为 JSON

git add .
git commit -m "更新展车数据"
git push                      # Cloudflare Pages 自动部署
```

## 技术栈

- **前端框架**: Next.js 14 (静态导出)
- **样式**: Tailwind CSS
- **数据格式**: JSON（静态文件）
- **托管平台**: Cloudflare Pages（国内访问快）
- **审批流程**: 飞书多维表（自带消息推送）

## 部署到 Cloudflare Pages

### 1. 注册 Cloudflare

1. 打开 https://dash.cloudflare.com/sign-up
2. 用邮箱注册（无需信用卡）

### 2. 创建 Pages 项目

1. 登录后点击左侧 **「Pages」**
2. 点击 **「Create a project」**
3. 选择 **「Connect to Git」**
4. 授权 Cloudflare 访问你的 GitHub 账号
5. 选择 `ucs-car-recommend` 仓库
6. 配置：
   - **Framework preset**: `Next.js`
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `out`
7. 点击 **「Save and Deploy」**

### 3. 等待部署完成

约 1-2 分钟后，Cloudflare 会给你一个网址，例如：
```
https://ucs-car-recommend.pages.dev
```

### 4. 绑定自定义域名（可选）

1. 在 Cloudflare Pages 项目 → **Custom domains**
2. 点击 **「Set up a custom domain」**
3. 输入你的域名，按提示配置 DNS

## 数据文件格式

### 展车列表 Excel

| 列名 | 说明 | 示例 |
|------|------|------|
| VIN码 | 车架号 | LSxxxxxxxxxxxx |
| 车型 | 车型名称 | ES8 |
| 车漆 | 车漆颜色 | 云白 |
| 内饰主题 | 内饰颜色 | 阿尔卑斯灰 |
| 物理库位 | 车辆所在位置 | 杭州CDC |
| 实际到达点位 | 实际点位 | 交付中心 |
| 销售状态 | 可售/不可售 | 可售 |
| 质损车况记录 | 质损情况 | 无质损 |
| 是否降级车 | 降级标识 | 无 |

### 门店信息 Excel

| 列名 | 说明 | 示例 |
|------|------|------|
| 门店 | 门店全称 | 杭州|城北万象城 |
| 归属行政片区 | 所在行政区 | 上城区 |

## 飞书多维表配置

1. 在飞书创建多维表（Base）
2. 添加字段：销售姓名、所在门店、目标门店、车型、车架号、车漆、内饰、申请状态、审批备注
3. 创建「表单视图」用于销售填写
4. 在表单设置中开启审批功能
5. 将表单链接配置到 `src/app/page.tsx` 中的 `generateFeishuLink` 函数

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 注意事项

1. **数据更新延迟**：Git push 后需要 1-2 分钟重新部署，不是秒级实时
2. **已选用车辆**：需要你手动维护 Excel 中标记，次日更新到网站
3. **并发申请**：两个销售可能同时申请同一辆车（飞书多维表端需配置校验规则）
4. **图片优化**：静态导出模式下图片未优化，如有图片需求请使用外部图床
