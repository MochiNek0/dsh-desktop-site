---
title: 安装指引
description: 各平台的安装方式、首次启动可能遇到的拦截，以及日常使用须知。
order: 1
---

## Windows

安装包为 `.exe`（NSIS）。需要 WebView2，缺失时会自动引导安装（已验证）。首次启动缺失环境时需联网拉取核心组件，之后即开即用，无需手动配置。

## macOS

通用二进制，支持 Apple Silicon 与 Intel。首次运行被系统拦截时，在访达中右键点击应用选择「打开」，或在终端执行以下命令解除隔离：

```bash
xattr -dr com.apple.quarantine /Applications/dsh-desktop.app
```

## Linux

推荐 AppImage，以获得完整的自动更新支持（Debian 系已验证）。下载后赋予可执行权限即可运行：

```bash
chmod +x dsh-desktop_*_amd64.AppImage
./dsh-desktop_*_amd64.AppImage
```

Debian / Ubuntu 也可以直接安装 `.deb` 包，体积更小。

## 国内网络加速

应用首次启动需要从 npm 拉取 dsh 组件。若下载缓慢，可以先为 npm 配置国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

v0.1.19 起也可以在应用的「设置…」里直接选择安装源：沿用系统的 `.npmrc`，或自动测速选出最快的镜像。

## 日常使用须知

- **自动运行环境**：若机器上没有可用的 Node，应用会自动弹出「运行环境」面板，一键装好 Node 24。全程不需要管理员权限。
- **关闭即收进托盘**：点窗口的关闭按钮只会收进托盘常驻，长线任务不中断；彻底退出请用菜单里的「退出 dsh」。
- **静默检查更新**：启动时在后台静默检查，有更新才提示，下载前先征求同意。
