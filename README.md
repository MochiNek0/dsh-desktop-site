# dsh-desktop-site

[dsh desktop](https://github.com/MochiNek0/dsh-desktop) 官方网站与使用文档源码。

🌐 **线上地址**：[dsh-desktop.cc.cd](https://dsh-desktop.cc.cd/) · [English](https://dsh-desktop.cc.cd/en/)

[![Website](https://img.shields.io/badge/Website-dsh--desktop.cc.cd-2ea44f?logo=googlechrome&logoColor=white)](https://dsh-desktop.cc.cd/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-v2-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%26%20D1-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 项目特性

- **极致性能与首屏加载**：
  - 基于 SvelteKit 2 + Svelte 5 构建，使用 `@sveltejs/adapter-static` 将所有页面预渲染为纯静态 HTML。
  - 路由 CSS 样式构建期自动内联进 `<head>`（`inlineStyleThreshold`），消除关键渲染阻塞网络往返。
  - 首屏动效采用纯 CSS 滚动驱动时间线（`view()` 驱动），无运行时 JS 动效库开销。
- **自动化发布数据管道**：
  - **Release 数据同步**（`scripts/sync-release.mjs`）：由应用仓库 [dsh-desktop](https://github.com/MochiNek0/dsh-desktop) 发布 Release 时通过 `repository_dispatch` 自动触发，拉取真实安装包体积、版本号与许可证，烘焙进预渲染页面，完全告别手动改版。
  - **下载量去重汇总**（`scripts/aggregate-downloads.mjs`）：每日定时由 GitHub Actions 抓取 GitHub 侧与各国内镜像代理的点击数据，通过非对称去重算法计算全网真实下载量。
  - **智能搜索引擎推送**（`scripts/indexnow.mjs`）：每次部署仅向 IndexNow 提交内容实际发生变更的页面。
- **Markdown 文档与静态高亮**：
  - 使用 MDSveX 将 `src/docs/` 下的 Markdown 文档直接作为路由组件解析。
  - Shiki 语法高亮在构建期完成，生成带内联样式的静态 HTML，运行时零语法分析负担。
- **全站中英双语与 SEO**：
  - 严格双向 `hreflang` 关联、规范化 `<link rel="canonical">`、预渲染 `sitemap.xml`。
  - 遵循 Schema.org 规范的完整 JSON-LD 结构化数据（`WebSite`、`SoftwareApplication`、`Person`）。
  - 提供大模型与 AI 抓取专用的 [/llms.txt](https://dsh-desktop.cc.cd/llms.txt)（结构化关键事实）与 [/llms-full.txt](https://dsh-desktop.cc.cd/llms-full.txt)（单文件全量文档）。
- **国内高速下载与镜像竞速**：
  - 内置客户端并发测速算法（`src/lib/mirror-race.ts`），自动为访客优选当前最快的国内加速镜像。

---

## 目录结构

```text
dsh-desktop-site/
├── .github/workflows/          # 自动化同步与下载量定时汇总流水线
│   ├── sync-release.yml        # 监听桌面端发版事件同步 release-data.json
│   └── aggregate-downloads.yml # 每日汇总下载量并写回仓库
├── migrations/                 # Cloudflare D1 数据库迁移（点击与访问统计表）
├── scripts/                    # 构建与自动化脚本
│   ├── sync-release.mjs        # GitHub Release 数据拉取
│   ├── aggregate-downloads.mjs # 下载量统计与去重计算
│   └── indexnow.mjs            # IndexNow 搜索引擎推送
├── src/
│   ├── docs/                   # 中英文双语使用文档
│   │   ├── zh/                 # 中文文档（安装、快捷操作、插件、手机连接、FAQ等）
│   │   └── en/                 # 对应英文文档
│   ├── lib/
│   │   ├── components/         # 页面组件（Download, Header, Footer, QrScanner 等）
│   │   ├── i18n.svelte.ts      # 双语字典与语言状态管理
│   │   ├── mirror-race.ts      # 下载源测速与自动选择
│   │   ├── release-data.json   # 自动同步的最新 Release 元数据
│   │   └── releases.ts         # 下载源与平台包常量定义
│   └── routes/                 # 页面路由
│       ├── [[lang=lang]]/      # 首页及文档通用语言路由
│       │   ├── docs/           # 文档中心与单篇渲染
│       │   └── go/             # 手机远程连接扫码与接入门户
│       ├── llms.txt/           # AI 助手摘要清单端点
│       ├── llms-full.txt/      # AI 助手全量文档聚合端点
│       └── sitemap.xml/        # 自动生成的全站站点地图
├── static/                     # 静态资源（预览图、Favicon、Web App 清单等）
├── worker/                     # Cloudflare Worker 后端（/api 统计与 D1 交互）
├── svelte.config.js            # SvelteKit + MDSveX + Shiki 静态配置
└── wrangler.jsonc              # Cloudflare Workers & D1 部署配置
```

---

## 本地开发

### 环境要求

- **Node.js**：`>= 22`
- **包管理器**：`npm` / `pnpm`

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

本地服务启动后，在浏览器访问控制台提示的地址（默认 `http://localhost:5173/`）。

### 3. 同步最新 Release 数据（可选）

如需更新 `src/lib/release-data.json` 中的最新版本号与资产体积：

```bash
npm run sync:release
```

*注：国内环境若遇到 GitHub API 限流，可提供环境变量 `GITHUB_TOKEN=<your_token>`。*

### 4. 类型检查与代码校验

```bash
npm run check
```

---

## 构建与部署

本项目前端托管于 Cloudflare Workers（绑定静态 Assets 与 D1 数据库）。

### 生产构建

```bash
npm run build
```

构建产物将输出至 `build/` 目录。

### 部署到 Cloudflare

```bash
npm run deploy
```

> **注意**：部署前确保本地已登录 Cloudflare（`npx wrangler login`），并在 `wrangler.jsonc` 中正确配置你的 D1 `database_id`。

---

## 相关项目

- **桌面客户端**：[MochiNek0/dsh-desktop](https://github.com/MochiNek0/dsh-desktop)
- **上游项目**：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
- **插件市场**：[DSH Market](https://dshmarket.com)
