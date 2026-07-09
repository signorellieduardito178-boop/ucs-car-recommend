# UCS展车外借推荐系统 — 共享协作版

## 项目简介

基于 Next.js 14 + MongoDB Atlas + Vercel 构建的展车共享申请平台。

| 角色 | 权限 |
|------|------|
| **销售** | 检索展车、提交借用申请（填写姓名+所在门店即可） |
| **管理员** | 上传/更新展车数据、审批销售申请、重置车辆状态 |

## 系统截图预览

- **销售端**：填写姓名+门店 → 输入需求 → 查看推荐 → 点击「申请借用」
- **管理后台**：登录 → 查看待审批列表 → 点击同意/否决 → 上传新数据

## 第一步：环境准备（免费）

### 1.1 注册 MongoDB Atlas（免费数据库）

1. 打开 https://www.mongodb.com/atlas
2. 点击「Try Free」，用邮箱注册
3. 创建集群：
   - 选择「Shared」免费层（M0）
   - 选择 AWS + 新加坡/东京区域（离你最近）
   - 集群名保持默认即可
4. 创建数据库用户：
   - 左侧菜单 → Database Access → Add New Database User
   - 用户名：`ucs_admin`
   - 密码：自己设一个（记住它！）
   - 权限：Read and write to any database
5. 设置网络访问：
   - 左侧菜单 → Network Access → Add IP Address
   - 点击「Allow Access from Anywhere」（Vercel 是动态 IP）
6. 获取连接字符串：
   - 回到 Clusters 页面，点击「Connect」→「Drivers」
   - 选择 Node.js，复制连接字符串
   - 格式如：`mongodb+srv://ucs_admin:密码@cluster0.xxxxx.mongodb.net/ucs_car?retryWrites=true&w=majority`

### 1.2 确认 GitHub 账号

确保你有 GitHub 账号（你的用户名：`signorellieduardito178-boop`）

---

## 第二步：本地运行（可选，用于测试）

### 2.1 安装 Node.js

下载并安装 LTS 版本：https://nodejs.org/

### 2.2 安装依赖

```bash
# 进入项目目录
cd ucs-car-recommend

# 安装依赖
npm install
```

### 2.3 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
MONGODB_URI=mongodb+srv://ucs_admin:你的密码@cluster0.xxxxx.mongodb.net/ucs_car?retryWrites=true&w=majority

# 飞书机器人（可选，不配置则不发通知）
FEISHU_WEBHOOK_URL=
```

### 2.4 启动开发服务器

```bash
npm run dev
```

浏览器打开 http://localhost:3000 即可使用。

---

## 第三步：部署到 Vercel（正式环境）

### 3.1 注册 Vercel

1. 打开 https://vercel.com
2. 用 GitHub 账号登录（Sign up with GitHub）
3. 授权 Vercel 访问你的 GitHub 仓库

### 3.2 创建 GitHub 仓库并上传代码

```bash
# 在项目根目录初始化 git
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 上创建新仓库（名字如 ucs-car-recommend）
# 然后关联并推送
git remote add origin https://github.com/signorellieduardito178-boop/ucs-car-recommend.git
git branch -M main
git push -u origin main
```

### 3.3 在 Vercel 上部署

1. 打开 https://vercel.com/dashboard
2. 点击「Add New Project」
3. 找到 `ucs-car-recommend` 仓库，点击「Import」
4. 配置环境变量：
   - 找到「Environment Variables」区域
   - 添加 `MONGODB_URI`，值为你的 MongoDB 连接字符串
   - 如有飞书 webhook，也添加 `FEISHU_WEBHOOK_URL`
5. 点击「Deploy」
6. 等待 1-2 分钟，部署完成后会获得一个网址，如：
   ```
   https://ucs-car-recommend-xxxx.vercel.app
   ```

### 3.4 绑定自定义域名（可选）

1. Vercel 项目 → Settings → Domains
2. 输入你的域名（如 `car.yourcompany.com`）
3. 按提示在域名服务商处添加 CNAME 记录

---

## 第四步：飞书机器人配置（可选）

如果想让新申请自动推送到飞书群：

1. 在飞书群聊中点击「设置」→「群机器人」→「添加机器人」→「自定义机器人」
2. 给机器人起个名字（如「展车申请助手」）
3. 复制 Webhook 地址
4. 将地址填入 Vercel 环境变量的 `FEISHU_WEBHOOK_URL`
5. 重新部署项目

---

## 使用说明

### 销售如何使用

1. 打开网站首页
2. 填写姓名和所在门店
3. 输入需求（如「城北万象城要一辆es8，白色」）
4. 可选填写车漆/内饰偏好（支持模糊匹配）
5. 点击「获取推荐」
6. 在结果中点击「申请借用」
7. 等待管理员审批

### 管理员如何使用

1. 打开 `/admin` 页面（或点击底部「管理员入口」）
2. 用账号 `3240102091` 和密码 `qiao6789786123` 登录
3. **数据管理**：上传展车列表和门店信息 Excel（会全量替换）
4. **待审批**：查看销售提交的申请，点击「同意」或「否决」
5. **审批历史**：查看所有已处理的申请
6. **重置状态**：点击「重置所有车辆状态」恢复全部可借车辆

---

## 数据文件格式要求

### 展车列表 Excel

| 列名 | 说明 | 示例 |
|------|------|------|
| VIN码 | 车架号（唯一标识） | LSxxxxxxxxxxxx |
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

---

## 常见问题

### Q1: 部署后访问很慢？
A: Vercel 免费版的 CDN 主要在美国，国内访问可能稍慢。如需更快，建议升级到腾讯云轻量服务器（约50元/月）。

### Q2: MongoDB 免费额度够用吗？
A: Atlas M0 免费层提供 512MB 存储。展车数据通常只有几百条，完全够用。

### Q3: 如何修改管理员密码？
A: 修改 `src/app/api/auth/route.ts` 中的 `ADMIN_PASS` 变量，重新部署即可。

### Q4: 销售申请后多久能收到通知？
A: 如果配置了飞书机器人，申请提交后 1-2 秒内会推送。如果没有配置，管理后台每 10 秒自动刷新待审批列表。

---

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: MongoDB Atlas (Mongoose ORM)
- **认证**: JWT (jose)
- **样式**: Tailwind CSS
- **部署**: Vercel
- **Excel解析**: xlsx
