# AI时代的21天批判性思维养成计划

一个 0 金钱成本、文本优先、无登录系统的 Next.js + Tailwind CSS + Supabase PostgreSQL 网站。适合约 30 人同时在线的小型共学场景。

## 项目目录结构

```text
.
├─ app
│  ├─ admin/page.tsx
│  ├─ api/admin
│  │  ├─ contents/route.ts
│  │  ├─ data/route.ts
│  │  ├─ login/route.ts
│  │  ├─ logout/route.ts
│  │  └─ moderate/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components
│  ├─ AdminClient.tsx
│  ├─ Avatar.tsx
│  ├─ HomeClient.tsx
│  └─ ProfileGate.tsx
├─ lib
│  ├─ admin-auth.ts
│  ├─ constants.ts
│  ├─ sanitize.ts
│  ├─ supabase
│  │  ├─ admin.ts
│  │  └─ client.ts
│  └─ types.ts
├─ supabase/schema.sql
├─ .env.example
├─ package.json
├─ tailwind.config.ts
└─ tsconfig.json
```

## Supabase 数据库 SQL 与 RLS

完整 SQL 在 `supabase/schema.sql`。它会创建这些表：

- `profiles`：轻账户资料
- `signups`：时间接龙
- `course_contents`：管理员发布的工具、方法、案例
- `content_comments`：模块 2 评论
- `topics`：争议话题与困扰
- `topic_comments`：模块 3 评论

执行方式：

1. 打开 Supabase 项目。
2. 进入 SQL Editor。
3. 粘贴并运行 `supabase/schema.sql` 的全部内容。

RLS 已在 SQL 中启用：

- 普通访客可创建轻账户。
- 普通访客可读取公开内容、接龙、评论、话题。
- 普通访客可新增评论和话题，但不能删除内容。
- 修改资料、修改接龙、发布评论、发布话题都通过数据库函数校验提交码，并由数据库写入真实昵称头像。
- 管理员删除、编辑、查看全部数据通过服务端 `SUPABASE_SERVICE_ROLE_KEY` 执行，不暴露给前端。

## 管理员环境变量配置

复制 `.env.example` 为 `.env.local`，填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
ADMIN_1_NAME=admin-a
ADMIN_1_PASSWORD=强密码
ADMIN_2_NAME=admin-b
ADMIN_2_PASSWORD=另一个强密码
ADMIN_SESSION_SECRET=一串随机长文本
```

注意：

- `ADMIN_*_PASSWORD` 和 `SUPABASE_SERVICE_ROLE_KEY` 只在服务端 API 使用。
- 不要把 `.env.local` 上传到 GitHub。
- Vercel 部署时也要在 Project Settings 的 Environment Variables 中配置同样变量。

## Vercel 部署步骤

1. 注册或登录 Vercel，使用免费 Hobby 计划。
2. 新建 Project，导入 GitHub 仓库。
3. Framework Preset 选择 Next.js。
4. 在 Environment Variables 中添加 `.env.example` 里的所有变量。
5. 点击 Deploy。
6. 部署完成后访问 Vercel 分配的域名，后台入口是 `/admin`。

## GitHub 上传步骤

本机安装 Git 后，在项目目录执行：

```bash
git init
git add .
git commit -m "Create 21-day critical thinking site"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

当前环境里 `git` 命令不可用，所以这里提供步骤；在安装 Git 的终端中运行即可。

## 本地运行步骤

```bash
npm install
cp .env.example .env.local
npm run dev
```

然后打开：

```text
http://localhost:3000
```

管理员后台：

```text
http://localhost:3000/admin
```

## 约束说明

- 不做邮箱、手机号、微信登录。
- 不上传图片和视频。
- 不使用 Supabase Storage。
- 所有用户内容都是文本。
- 头像来自内置系统头像。
- 前端会对输入做基础过滤，数据库也有长度与枚举约束。
