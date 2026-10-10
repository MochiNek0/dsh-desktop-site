---
title: 和官方桌面端的区别
description: dsh desktop 与 DeepSeek Harness 官方桌面端在平台、体积、手机连接、许可证上的区别，以及怎么选。
order: 5
---

DeepSeek 推出了 DeepSeek Harness 官方桌面端。dsh desktop 是社区做的第三方客户端，与 DeepSeek 官方没有隶属关系，两者可以同时装在一台电脑上。

## 对比

官方桌面端一列摘自 [DeepSeek Harness 官网](https://www.deepseek.com/harness/)，安装包体积取自官网下载地址上 2026 年 9 月 29 日的文件。官网之后有更新的话以官网为准。

| | dsh desktop | 官方桌面端 |
| --- | --- | --- |
| 开发方 | 社区（第三方） | DeepSeek |
| 状态 | 正式版 | 预览版 |
| Windows | 支持（x64） | 支持（64 位） |
| macOS | 支持（通用二进制，Apple Silicon 与 Intel） | 支持（Apple 芯片） |
| Linux | 支持（.deb / .AppImage） | 官网未提及 |
| 安装包体积 | Windows 约 2.5 MB，macOS 约 6.3 MB，Debian 约 4.1 MB | Windows 约 276 MB，macOS 约 353 MB |
| 手机连接电脑上的 dsh | 支持：局域网、Tailscale、Cloudflare 隧道 | 官网未提及 |
| 插件 | 支持，另有桌面端插件面板，可从 DSH Market 安装 | 支持 |
| 许可证 | AGPL-3.0 | MIT |

## dsh desktop 是怎么做的

dsh desktop 不改 dsh 的源码。它在后台启动本地的 `dsh web`，再把这个页面嵌进一个原生窗口，所以界面和功能就是你所装版本的 dsh web 本身，像对话式创建插件的「创造模式」这类 dsh web 自带的功能，两边都有。会话、凭证与配置都在 `$DSH_HOME`（默认 `~/.dsh`），和命令行里的 dsh 共用。

它用系统自带的 WebView（Windows 的 WebView2、macOS 的 WebKit、Linux 的 WebKitGTK），不打包浏览器内核，这是安装包只有几 MB 的原因。Linux 的 AppImage 自带 WebKit，所以大一些。

## 怎么选

- 想用 DeepSeek 原厂出品的客户端：选 [官方桌面端](https://www.deepseek.com/harness/)。
- 想在手机上接着用电脑里的 dsh、用 Linux，或者在意安装包体积：选 dsh desktop。

两者都可以和终端里的 `dsh` 一起用。dsh desktop 的手机连接怎么用，见 [手机连接](../phone-connection/)。
