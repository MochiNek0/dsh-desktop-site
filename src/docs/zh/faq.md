---
title: 常见问题
description: 关于 dsh desktop 的来历、环境、体积、兼容性与反馈渠道。
order: 4
---

## dsh desktop 是 DeepSeek 官方产品吗？

不是。本项目是基于 DeepSeek Harness 开发的第三方开源桌面客户端，与 DeepSeek 官方没有隶属或合作关系，代码在 GitHub 完全开源。如需体验官方桌面端，可前往 [DeepSeek Harness 官网](https://www.deepseek.com/harness/) 下载。

## 需要先安装 Node.js 和 dsh 吗？

不需要。应用会自动检测环境：如果机器上已有合适的 Node 和 dsh 就直接用；如果没有，应用会自动弹出「运行环境」面板，支持一键安装 Node 24 与 dsh。全程不需要管理员权限。

## 为什么安装包体积这么小（仅 2.5 MB 起）？

基于 Tauri v2 构建，直接调用操作系统自带的原生 WebView 内核（Windows WebView2 / macOS WebKit / Linux WebKitGTK），不打包上百兆的 Chromium 浏览器内核，内存与磁盘占用大幅缩减。

## 遇到插件崩溃导致应用打不开怎么办？

用「安全模式」：插件在 dsh web 端口绑定前加载，若遇崩溃停在加载页，加载页会直接提供「不加载插件启动」按钮，一键把用户插件暂摘出层列表启动，直接打开面板卸掉出问题的插件，之后在菜单点「重新加载插件」原样装回。详见 [插件](../plugins/)。

## 会和我终端里的 dsh 冲突吗？

完全不会。应用采用动态空闲端口分配，可以和终端里手动运行的 dsh web 同时开着。它也不会改写系统的全局 PATH，保证环境干净独立。

## 会话记录和配置存在哪里？支持哪些环境变量？

与 CLI 全局共享，严格保存在 `$DSH_HOME`（默认 `~/.dsh`）。支持 `DSH_BIN` 指定 dsh 可执行文件的绝对路径（优先级最高且跳过 Node 版本检查），支持 `DSH_HOME` 自定义数据与配置目录。

## 支持自动更新吗？

支持。桌面端启动时静默检查更新，有新版才提示，下载前征求同意。Linux 环境下推荐 AppImage 格式以获得最完整的自动更新支持。

## 支持哪些系统平台？

Windows（`.exe`）、macOS（`.dmg` 通用二进制，支持 Apple Silicon 与 Intel）和 Linux（`.deb` 与 `.AppImage`）。目前 Windows、macOS 与 Debian 系 Linux 均已完成验证。

## 有交流群或反馈渠道吗？

欢迎加入 QQ 交流群：1125671315，与大家探讨使用心得、反馈 Bug 与功能建议；也可随时在 [GitHub 仓库](https://github.com/MochiNek0/dsh-desktop/issues) 提交 Issue。
