# 礼金管理系统 — Vercel 部署文档

> 本文档面向有一定 Node.js 基础的开发者，介绍如何将本项目（Vite + React 前端 + Express 后端 + Supabase + Gemini AI）完整部署到 Vercel 平台。

---

## 目录

1. [前置条件](#1-前置条件)
2. [架构说明](#2-架构说明)
3. [步骤一：准备 Vercel Serverless 后端](#步骤一准备-vercel-serverless-后端)
4. [步骤二：配置 vercel.json](#步骤二配置-verceljson)
5. [步骤三：在 Vercel 控制台配置环境变量](#步骤三在-vercel-控制台配置环境变量)
6. [步骤四：连接 Git 仓库并部署](#步骤四连接-git-仓库并部署)
7. [步骤五：验证部署](#步骤五验证部署)
8. [常见问题排查](#常见问题排查)

---

## 1. 前置条件

| 项目 | 说明 |
|---|---|
| **Vercel 账户** | 在 [vercel.com](https://vercel.com) 免费注册 |
| **GitHub / GitLab 仓库** | 项目代码已推送到远程仓库 |
| **Supabase 项目** | 已创建并执行 `supabase_schema.sql` 初始化数据库 |
| **Gemini API Key** | 在 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取 |
| **Node.js 18+** | 本地环境版本要求 |

---

## 2. 架构说明

Vercel 不支持长驻 Express 服务，需要将 `server/index.ts` 中的路由改造为 **Vercel Serverless Functions**（`/api/*.ts` 文件）。

```
项目部署后的请求路径：
  前端静态文件  →  由 Vercel CDN 全球分发
  /api/*        →  由 Vercel Serverless Functions 处理（替代 Express 服务器）
  数据库操作    →  Serverless Function → Supabase Cloud
```

**改造前 vs 改造后对比：**

| 改造前（本地 Express） | 改造后（Vercel Serverless） |
|---|---|
| `server/index.ts`（单文件多路由） | `api/activities.ts`、`api/records.ts` 等独立文件 |
| `npm run dev:backend`（持久进程） | Vercel 按请求冷启动 |
| `server/.env` 本地配置 | Vercel 控制台 Environment Variables |

---

## 步骤一：准备 Vercel Serverless 后端

在项目根目录创建 `api/` 文件夹，每个路由对应一个文件。

### `api/activities.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message, message: '获取活动失败' });

    const formattedData = data.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      date: item.date,
      totalAmount: Number(item.total_amount) || 0,
    }));
    return res.json(formattedData);
  }

  if (req.method === 'POST') {
    const { title, type, date } = req.body;
    const { data, error } = await supabase
      .from('activities')
      .insert([{ title, type, date, total_amount: 0 }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message, message: '创建活动失败' });

    return res.json({
      id: data.id, title: data.title, type: data.type,
      date: data.date, totalAmount: Number(data.total_amount) || 0,
    });
  }

  res.status(405).json({ message: '不支持的请求方法' });
}
```

### `api/records.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('gift_records')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) return res.status(500).json({ error: error.message, message: '获取记录失败' });

    return res.json(data.map(item => ({
      id: item.id,
      activityId: item.activity_id,
      activityTitle: item.activity_title,
      giverName: item.giver_name,
      amount: Number(item.amount),
      timestamp: item.timestamp,
    })));
  }

  if (req.method === 'POST') {
    const { activityId, activityTitle, giverName, amount } = req.body;
    try {
      const { data: record, error: recordError } = await supabase
        .from('gift_records')
        .insert([{
          activity_id: activityId,
          activity_title: activityTitle,
          giver_name: giverName,
          amount: Number(amount),
          timestamp: new Date().toISOString(),
        }])
        .select()
        .single();

      if (recordError) throw recordError;

      const { data: activity } = await supabase
        .from('activities').select('total_amount').eq('id', activityId).single();

      if (activity) {
        await supabase.from('activities')
          .update({ total_amount: Number(activity.total_amount || 0) + Number(amount) })
          .eq('id', activityId);
      }

      const { data: existingGuest } = await supabase
        .from('guests').select('id').eq('name', giverName).single();

      if (!existingGuest) {
        await supabase.from('guests').insert([{ name: giverName }]);
      }

      return res.json({
        id: record.id, activityId: record.activity_id,
        activityTitle: record.activity_title, giverName: record.giver_name,
        amount: Number(record.amount), timestamp: record.timestamp,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message, message: '添加记录失败' });
    }
  }

  res.status(405).json({ message: '不支持的请求方法' });
}
```

### `api/records/[id].ts`（处理 PUT 请求）

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { activityId, activityTitle, giverName, amount } = req.body;

    try {
      const { data: oldRecord } = await supabase
        .from('gift_records').select('amount, activity_id').eq('id', id).single();

      const { data, error } = await supabase
        .from('gift_records')
        .update({ activity_id: activityId, activity_title: activityTitle, giver_name: giverName, amount: Number(amount) })
        .eq('id', id).select().single();

      if (error) throw error;

      if (oldRecord && oldRecord.activity_id === activityId) {
        const diff = Number(amount) - Number(oldRecord.amount);
        if (diff !== 0) {
          const { data: activity } = await supabase
            .from('activities').select('total_amount').eq('id', activityId).single();
          if (activity) {
            await supabase.from('activities')
              .update({ total_amount: Number(activity.total_amount || 0) + diff })
              .eq('id', activityId);
          }
        }
      }

      return res.json({
        id: data.id, activityId: data.activity_id,
        activityTitle: data.activity_title, giverName: data.giver_name,
        amount: Number(data.amount), timestamp: data.timestamp,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message, message: '更新记录失败' });
    }
  }

  res.status(405).json({ message: '不支持的请求方法' });
}
```

### `api/guests.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('guests').select('*');
    if (error) return res.status(500).json({ error: error.message, message: '获取宾客失败' });
    return res.json(data);
  }

  res.status(405).json({ message: '不支持的请求方法' });
}
```

---

## 步骤二：配置 vercel.json

在项目**根目录**创建 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 安装 Vercel Node.js 类型包

```bash
npm install --save-dev @vercel/node
```

---

## 步骤三：在 Vercel 控制台配置环境变量

进入 Vercel 项目 → **Settings** → **Environment Variables**，添加以下变量：

| 变量名 | 值来源 | 是否必填 |
|---|---|---|
| `SUPABASE_URL` | Supabase 项目 Settings → API → Project URL | ✅ 必填 |
| `SUPABASE_KEY` | Supabase 项目 Settings → API → `anon` public key | ✅ 必填 |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) | ✅ 必填 |
| `VITE_API_BASE_URL` | 留空（Vercel Functions 与前端同域，相对路径即可） | 可选 |

> **注意**：`SUPABASE_URL` 和 `SUPABASE_KEY` 仅用于 Serverless Functions（服务端），**不要**在前端 `vite.config.ts` 中暴露 `SUPABASE_KEY`。

---

## 步骤四：连接 Git 仓库并部署

### 方式 A：通过 Vercel 控制台（推荐新手）

1. 登录 [vercel.com/new](https://vercel.com/new)
2. 点击 **Import Git Repository**，选择本项目仓库
3. Framework Preset 选择 **Vite**
4. Build Command 填写：`npm run build`
5. Output Directory 填写：`dist`
6. 点击 **Deploy**

### 方式 B：通过 Vercel CLI（推荐开发者）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 在项目根目录执行部署
vercel

# 4. 生产环境部署
vercel --prod
```

---

## 步骤五：验证部署

部署完成后，访问 Vercel 分配的域名（如 `https://your-project.vercel.app`），逐一测试：

- [ ] 前端页面正常加载，无控制台报错
- [ ] `/api/activities` 接口返回 JSON 数据
- [ ] `/api/records` 接口返回 JSON 数据
- [ ] `/api/guests` 接口返回 JSON 数据
- [ ] 新建活动、记录礼金功能正常写入 Supabase
- [ ] Gemini AI 推荐功能可正常调用

### 快速接口测试命令

```bash
# 将 YOUR_DOMAIN 替换为你的 Vercel 域名
curl https://YOUR_DOMAIN.vercel.app/api/activities
curl https://YOUR_DOMAIN.vercel.app/api/records
curl https://YOUR_DOMAIN.vercel.app/api/guests
```

---

## 常见问题排查

### ❌ 接口返回 404

- 确认 `api/` 目录在项目**根目录**（与 `src/` 同级）
- 检查 `vercel.json` 的 `rewrites` 配置是否正确

### ❌ 接口返回 500 / Supabase 连接失败

- 在 Vercel 控制台检查 `SUPABASE_URL` 和 `SUPABASE_KEY` 是否已配置且无多余空格
- 确认 Supabase 项目处于活跃状态（免费套餐超过 7 天不活跃会暂停）

### ❌ 前端看到旧版或空白页

- 执行 `vercel --prod` 强制重新部署
- 或在 Vercel 控制台 → **Deployments** → 点击 **Redeploy**

### ❌ CORS 错误

- 本文档的 Serverless Functions 已在每个 handler 中设置 `Access-Control-Allow-Origin: *`
- 若仍然报错，检查前端代码中 API 请求的 URL 是否使用了相对路径（推荐）或正确的绝对路径

### ❌ Gemini AI 功能不可用

- 检查 `GEMINI_API_KEY` 是否在 Vercel 环境变量中配置
- 注意：前端通过 `vite.config.ts` 的 `define` 注入的 `GEMINI_API_KEY` 是在**构建时**读取的，需要在构建前配置好

---

## 附录：Supabase 数据库初始化

如尚未初始化数据库，请在 Supabase 控制台 → **SQL Editor** 中执行项目根目录的 `supabase_schema.sql` 文件内容。

---

*最后更新：2026-03-08*
