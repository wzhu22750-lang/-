# 🏸 H2H 羽毛球战绩记录

一个为羽毛球俱乐部设计的交手记录追踪工具，支持单/双打 ELO 积分、胜率统计及历史战绩回顾。

## 功能

- **俱乐部模式** — 日常约球记录，标准 ELO 积分
- **比赛模式** — 积分选拔赛，局分差加权 K 因子（险胜小幅涨跌、碾压大幅涨跌）
- **双打支持** — 不固定搭档，ELO 全量重算
- **H2H 分析** — 任意球员/组合对阵记录和胜率
- **战力排行** — 实时 ELO 段位榜单

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Supabase (数据库)
- Vercel (部署)

## 本地运行

```bash
npm install
npm run dev
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入 Supabase 配置：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 数据库

在 Supabase SQL Editor 中执行：

```sql
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'club';
```
