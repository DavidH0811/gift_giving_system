# 礼物赠送系统前后端全栈改造计划

本计划旨在将现有的 React 前端改造为全栈应用，使用 Express 提供后端 API，并接入 Supabase 作为数据存储。

## 1. 明确问题与用户评审需求

> [!IMPORTANT]
> **Supabase 准备工作**：
> 本计划需要您拥有一个 Supabase 项目。请确认是否已经创建好项目？
> 之后我们需要将您的 `SUPABASE_URL` 和 `SUPABASE_KEY` 写入后端的 `.env` 文件。

## 2. 数据库设计 (Supabase Schema)

我们将使用 Supabase 托管的 PostgreSQL 数据库，结构如下：

1. **activities (活动表)**
   - `id`: UUID (Primary Key, default: `uuid_generate_v4()`)
   - `title`: Text
   - `type`: Text
   - `date`: Text (或 Date)
   - `created_at`: Timestamp with time zone
   - `total_amount`: Numeric (可选：为方便可直接缓存总金额，或者每次关联查询 sum)

2. **gift_records (随礼记录表)**
   - `id`: UUID (Primary Key)
   - `activity_id`: UUID (Foreign Key references `activities.id`)
   - `activity_title`: Text (冗余查询)
   - `giver_name`: Text
   - `amount`: Numeric
   - `timestamp`: Timestamp with time zone

3. **guests (来宾表)**
   - `id`: UUID (Primary Key)
   - `name`: Text

*(我会提供对应的 SQL 脚本)*

## 3. 拟进行的代码修改 (Proposed Changes)

---

### [环境与依赖]
在服务端和前端共享的根目录结构补充依赖项：

#### [MODIFY] `package.json`
增加 `cors`, `@supabase/supabase-js`, `@types/cors` 依赖。修改 `scripts` 启动命令同时启动前后端：
```json
"scripts": {
  "dev:frontend": "vite --port=3000 --host=0.0.0.0",
  "dev:backend": "tsx server/index.ts",
  "dev": "npm run dev:backend & npm run dev:frontend"
}
```

---

### [后端建设 Express API]

#### [NEW] `server/index.ts`
配置 Express，加入 `cors` 解决跨域，初始化 `@supabase/supabase-js` 客户端，监听 `3001` 端口。接口清单：
- `GET /api/activities`: 返回全部活动并在业务逻辑带回统计人数、金额。
- `POST /api/activities`: 新增活动。
- `GET /api/records`: 返回礼物记录和关联表。
- `POST /api/records`: 新增随礼（若来宾名未现则记录到 guests），金额记录下来。
- `PUT /api/records/:id`: 修改已有随礼。
- `GET /api/guests`: 返回所有去重来宾（可做快捷选择）。

#### [NEW] `server/.env`
存放后端的环境变量参数（不提交到 git）：
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

---

### [前端改造 UI/Services]

#### [NEW] `src/api.ts`
封装与 Express API （`http://localhost:3001/api`）通信的所有接口方法，基于 Fetch。

#### [MODIFY] `src/App.tsx`
- 移除引入 `mockData.ts`。
- 新增 `useEffect` 在应用挂载时分别拉取 `activities`、`records`、`guests` 数据并在页内分发。
- 修改“新建活动(handleAddNewActivity)” “保存记录(handleSaveRecord)” 改为请求 `src/api.ts` 的异步方法，并做 loading 状态控制。
- 确保符合 C-Design 关于阴影与微圆角 6~8px 的细致审美标准。

## 4. 验证计划 (Verification Plan)

### 手动与 Automated 验证
1. 启动完整的应用 `$ npm run dev`。
2. 借用 **Browser Subagent** 打开 `http://localhost:3000` 并截图以验证中文页面渲染不会乱码错位。
3. 表单测试：
   - 添加活动，判断数据库与接口返回。
   - 插入送礼记录，验证数据库 `activity.total_amount` 的计算，以及 `guests` 列表联动刷新。
