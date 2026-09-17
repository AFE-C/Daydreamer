# Daydreamer

Daydreamer 是一个本地优先的个人灵感与日记记录工具。

它适合记录那些还没有整理成文章的内容：突然想到的点子、当天的心情、零散的观察，或者一句暂时说不清楚的话。现在支持邮箱账号登录，并在保留本地优先体验的同时，把同一账号的记录同步到已登录设备。

> 把脑海里的微光，留在这里。

## 功能

- 创建和编辑记录
- 简洁富文本编辑：标题、粗体、斜体、删除线、列表、引用和链接
- 按时间线回看最近记录
- 在回顾页查看今日往事、随机灵感和按日期归档的记录
- 搜索标题、正文和标签
- 使用标签、心情和卡片颜色整理记录
- 收藏重要记录
- 导出 JSON 备份
- 导入 JSON 备份，并与现有记录安全合并
- 响应式布局，支持桌面和移动端浏览器
- 可安装为手机或桌面 PWA，首次在线打开后支持离线记录
- 邮箱注册、登录、邮箱验证和密码重置
- 同一账号的多设备同步；离线编辑会在联网后自动上传
- 支持系统的“减少动态效果”设置

## 产品特点

### 本地优先与账号隔离

记录首先写入当前浏览器的 IndexedDB。登录后，每条本地记录会带有当前 Supabase 用户 ID，只读取和同步这个账号的数据；不同账号在同一台设备上也不会互相看到记录。

这意味着：

- 未登录前产生的旧记录，会在第一次成功登录后合并到当前账号
- 云端同步按记录的 `updatedAt` 采用较新版本
- 网络不可用时仍可编辑；同步失败不会阻塞本地保存
- 清理浏览器站点数据可能会删除记录
- 更换设备或浏览器前，应先从“备份与恢复”中导出 JSON 文件
- 首次在线打开后，应用外壳会缓存到本机；断网时仍可创建、编辑、搜索和导出记录

### 安装与离线使用

打开一次在线版本后，Daydreamer 会准备离线所需的应用资源。你可以在“备份与恢复”中安装到桌面或手机主屏幕，之后像普通应用一样打开。

在 iPhone 上，如果浏览器没有显示自动安装按钮，请在 Safari 中使用“分享 → 添加到主屏幕”。网络恢复后，应用会提示你手动刷新到新版本，不会强制打断正在编辑的内容。

### 安全导入

导入备份不会直接覆盖现有记录，而是按记录 ID 合并：

- 新记录会被加入
- 同一条记录以 `updatedAt` 较新的版本为准
- 较旧版本会被跳过

### 回顾旧想法

点击顶部的“回顾”可以进入回顾中心。这里按记录的创建时间整理内容，不会因为后来编辑记录而改变它原本的日期。

- “今日往事”会寻找往年同月同日留下的记录
- “随机灵感”可以在不离开当前页面的情况下换一条旧记录
- 月份日历会标出有记录的日期，点击日期即可查看当天内容
- 日历只允许浏览最早记录所在月份到当前月份，不会进入未来日期

回顾中心读取当前账号在本机缓存中的记录。没有历史记录时，页面会引导你先写下第一条。

## Supabase 配置

项目使用 Supabase Auth（邮箱/密码）和 PostgreSQL `entries` 表。浏览器端只使用 publishable key，不要把 service role key 写进前端环境变量。

1. 在 Supabase 项目的 SQL Editor 中执行 [`supabase/migrations/001_entries.sql`](supabase/migrations/001_entries.sql)。
2. 在本地创建 `.env.local`（该文件已被 `.gitignore` 忽略）：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

3. 在 Supabase Authentication 设置中确认邮箱验证和站点 URL。开发环境需要加入 `http://localhost:5173`；部署后加入 Netlify 站点地址。

账号删除函数位于 `supabase/functions/delete-account/index.ts`，需要使用 Supabase CLI 部署，并在函数环境中保留 `SUPABASE_SERVICE_ROLE_KEY`，不要提交到仓库。

## 快速开始

### 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本

### 安装和运行

```bash
git clone https://github.com/AFE-C/Daydreamer.git
cd Daydreamer
npm install
npm run dev
```

然后打开终端输出的本地地址，默认通常是：

```text
http://localhost:5173/
```

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 执行 TypeScript 检查并构建生产版本 |
| `npm run preview` | 预览生产构建结果 |

`npm run build` 会额外生成 `dist/404.html`，用于 GitHub Pages 上的 BrowserRouter 深链接回退。测试基础设施已保留，测试用例会随着功能继续补充。

## GitHub Pages 部署

推送到 `main` 分支后，`.github/workflows/deploy-pages.yml` 会自动构建并发布到 GitHub Pages。

第一次启用时，请在仓库的 `Settings → Pages` 中将发布来源设为 `GitHub Actions`。项目地址通常是：

```text
https://afe-c.github.io/Daydreamer/
```

应用已经针对这个仓库路径设置了生产环境 `base`，并保留了干净的 `/entry/:id` 路由。

### Netlify 部署

项目根目录已经提供 `netlify.toml`：构建命令为 `npm run build`，发布目录为 `dist`，并为 React Router 配置了 SPA 回退。Netlify 环境变量中需要添加：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Netlify 使用根路径 `/`，GitHub Actions 使用 `/Daydreamer/`，两者的 PWA 路径会根据发布环境自动切换。

## 技术栈

- React 18
- TypeScript
- Vite
- React Router
- TipTap
- Dexie + IndexedDB
- Supabase Auth + PostgreSQL（云端同步）
- 原生 CSS Variables、CSS 渐变和玻璃材质效果

项目不加载远程字体、统计脚本或外部图片资源。Supabase 仅用于身份验证和已登录用户的数据同步。

## 页面入口

| 路径 | 用途 |
| --- | --- |
| `/` | 时间线、搜索、标签筛选和收藏筛选 |
| `/review` | 今日往事、随机灵感和按日期回顾 |
| `/entry/new` | 创建新记录 |
| `/entry/:id` | 编辑已有记录 |

## 项目结构

```text
Daydreamer/
├─ public/
│  └─ favicon.svg                 # 网站图标
├─ src/
│  ├─ app/                        # 应用级事件和配置
│  ├─ components/                 # 通用界面组件
│  ├─ db/                         # Dexie / IndexedDB 数据库
│  ├─ features/auth/              # 登录、注册和会话管理
│  ├─ features/entries/           # 时间线、记录卡片和编辑器
│  ├─ hooks/                      # 在线状态和 PWA 安装能力
│  ├─ services/                   # 记录、备份和同步服务
│  ├─ styles/                     # 全局视觉样式
│  ├─ types/                      # 数据类型和常量
│  ├─ App.tsx                     # 路由和应用入口
│  └─ main.tsx                    # React 挂载入口
├─ scripts/copy-spa-fallback.mjs  # 生成 GitHub Pages 深链接回退页
├─ .github/workflows/             # GitHub Pages 自动部署
├─ supabase/                       # 数据库迁移和 Edge Function
├─ netlify.toml                    # Netlify 构建与 SPA 回退
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 数据模型

每条记录包含以下信息：

- 标题
- TipTap 富文本 JSON
- 用于搜索的纯文本内容
- 标签
- 可选心情
- 卡片颜色
- 是否收藏
- 创建时间和更新时间

数据库名称为 `daydreamer-db`，当前本地数据库版本为 `2`。云端表为 `public.entries`，通过 RLS 按 `auth.uid() = user_id` 隔离账号。

## 设计方向

Daydreamer 使用浅色液态玻璃作为界面语言，但没有直接依赖外部 Logo 图片：

- 近白色背景与低饱和青蓝、淡紫色调
- 半透明表面、边缘高光和背景模糊
- 轻量的玻璃质感品牌标记
- 编辑器和时间线优先，装饰只作为辅助层
- 通过 CSS 实现视觉效果，不加载外部图片和字体

## 当前边界

当前版本暂不包含：

- AI 摘要或自动标签
- 图片附件和语音输入
- Markdown 导出
- 端到端加密云同步

## 后续计划

后续可以按实际使用频率逐步加入：

1. Markdown 导出
2. 可选的加密备份
3. 端到端加密备份
4. 更细的时间线筛选和回顾方式

## License

当前仓库尚未指定开源许可证。如果计划允许他人修改、分发或商用，建议后续补充明确的 `LICENSE` 文件。
