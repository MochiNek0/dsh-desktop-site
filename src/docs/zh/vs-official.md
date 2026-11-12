---
title: 和官方桌面端的区别
headTitle: dsh desktop 与 DeepSeek Harness 官方桌面端的区别
description: dsh desktop 与 DeepSeek Harness 官方桌面端在支持平台、安装包体积、快捷键、手机连接、许可证上的区别，以及该按什么场景选哪一个。
order: 6
---

DeepSeek 推出了 DeepSeek Harness 官方桌面端。dsh desktop 是社区做的第三方客户端，与 DeepSeek 官方没有隶属关系，两者可以同时装在一台电脑上。

## 对比

官方桌面端一列摘自 [DeepSeek Harness 官网](https://www.deepseek.com/harness/)，安装包体积取自官网下载地址上 2026 年 11 月 12 日的文件。官网之后有更新的话以官网为准。

| | dsh desktop | 官方桌面端 |
| --- | --- | --- |
| 开发方 | 社区（第三方开源） | DeepSeek 官方 |
| 状态 | 正式版 | 预览版 |
| Windows | 支持（x64） | 支持（64 位） |
| macOS | 支持（通用二进制，Apple Silicon 与 Intel） | 支持（Apple 芯片，macOS 13 或更高） |
| Linux | 支持（.deb / .AppImage） | 官网未提及 |
| 安装包体积 | Windows 约 2.7 MB，macOS 约 6.7 MB，Debian 约 4.4 MB | Windows 约 280 MB，macOS 约 256 MB |
| 手机远程连接 | 支持：局域网、Tailscale、Cloudflare 隧道 | 官网未提及 |
| 快捷提问框与全局快捷键 | 支持（独立提问浮窗、主窗口显隐、剪贴板快速粘贴） | 官网未提及 |
| 文件管理器与协议直达 | 支持（右键打开文件夹、命令行与 dsh-desktop:// 协议） | 官网未提及 |
| 任务执行防休眠 | 支持（有任务运行时阻止系统睡眠，跑完自动恢复） | 官网未提及 |
| 定时任务与自动化 | 支持（随 dsh web 自带，两边都有） | 支持 |
| 托盘会话直达与状态 | 托盘列出等待/运行中会话，图标状态角标指示 | 仅基础托盘 |
| 插件管理 | 支持，内置插件面板、DSH Market、本地文件夹一键 link | 支持 |
| 许可证 | AGPL-3.0 | MIT |

## dsh desktop 是怎么做的

dsh desktop 不改 dsh 的源码。它在后台启动本地的 `dsh web`，再把这个页面嵌进一个原生窗口，所以界面和功能就是你所装版本的 dsh web 本身。会话、凭证与配置都在 `$DSH_HOME`（默认 `~/.dsh`），和命令行里的 dsh 共用。

这也决定了哪些能力是「自带」的。dsh web 本来就有的，dsh desktop 全都有，官方桌面端因为跑的也是 dsh web，所以同样有：

- 插件体系，包括对话式创建插件的「创造模式」
- 定时任务与自动化
- 完成各类任务（整理文档、分析表格、写代码、本地文件读写、后台运行）
- 终端、Agent 循环、子智能体，以及执行轨迹等开发者工具
- 实验性功能：智能体团队、自动授权审查、语音输入

而下面这些是 dsh desktop 在原生窗口之外额外加的，直接在浏览器里开 dsh web 没有这些，也是它和官方桌面端的主要差异：

- 手机远程连接
- 托盘会话直达与状态角标
- 快速提问框与全局快捷键
- 文件管理器右键直达与 `dsh-desktop://` 协议
- 任务运行防休眠
- 独立环境变量终端

它用系统自带的 WebView（Windows 的 WebView2、macOS 的 WebKit、Linux 的 WebKitGTK），不打包浏览器内核，这是安装包只有几 MB 的原因。Linux 的 AppImage 自带 WebKit，所以大一些。

## 怎么选

- 想用 DeepSeek 原厂出品的客户端：选 [官方桌面端](https://www.deepseek.com/harness/)。
- 想在手机上远程连接、使用 Linux、需要全局快捷键与快速提问、需要文件管理器右键直接打开文件夹，或在意安装包体积：选 dsh desktop。

两者都可以和终端里的 `dsh` 一起用。使用指引见 [快捷操作与工作区](../shortcuts/) 与 [手机连接](../phone-connection/)。
