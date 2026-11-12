---
title: 安装指引
headTitle: dsh desktop 安装指引（Windows / macOS / Linux）
description: dsh desktop 在 Windows、macOS、Linux 三平台的安装步骤，运行环境如何自动检测，首次启动可能被系统拦截时怎么处理，应用自带安装的 dsh 被杀毒软件隔离时如何加白名单，以及日常使用前值得先知道的几件事。
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

### 装不上 / 进度条卡在 0：残留的 npm 代理

**现象**：命令行里 `npm install -g` 报 `ETIMEDOUT`、`network request to ... failed`；在 dsh desktop 里则是「安装 dsh / 安装 Node」的进度条一直停在 0，在几个源之间来回切换，始终装不完。原因多是 npm 里残留了一个**全局代理**，它把所有请求都截走，而代理本身（或它监听的端口）在你的网络下连不上。命令行报错里的 `IP:端口` 通常就是这个代理地址，而不是你指定的 registry。

**排查**——看 npm 实际用的代理配置：

```powershell
npm config get proxy
npm config get https-proxy
```

只要这两项里有一项有值，基本就是它了。

**解决**——清掉代理：

```powershell
npm config delete proxy
npm config delete https-proxy
```

代理也可能通过环境变量设的，一并清空：

```powershell
$env:HTTP_PROXY=""
$env:HTTPS_PROXY=""
$env:ALL_PROXY=""
```

改完后回 dsh desktop 重新触发安装即可。

> 提示：如果残留的代理不是你自己设置的，建议清干净后再装，避免 npm 流量继续走不明节点。

## 安装后启动失败：被杀毒软件拦截

如果你的电脑本来没有 Node，dsh desktop 会通过「运行环境」面板把 Node 24 和 dsh 装到自己目录（约 185 MB）。这一步 npm 会落下一批 `.exe`、`.cmd` 和脚本文件，**Windows 安全中心（Defender）、360、火绒等杀毒软件有时会在文件刚写好不久就把它们扫描并隔离**——`node.exe`、`dsh.cmd` 或包内文件一旦被带走，应用就会报「dsh 启动失败」或卡在加载页。

判断是不是这种情况：应用遇到这个问题会直接弹窗，列出**随后消失的文件路径**，并提示把应用数据目录加进杀毒软件的排除项。如果只是安装过程被打断，弹窗里多半还会出现 `EPERM`、`EBUSY` 之类的字样。

解决办法——把应用数据目录加入杀毒软件的排除项（白名单）后再重新安装一次：

1. 找到应用数据目录。默认就在安装时提示里给出的路径，通常是：

   ```text
   %LOCALAPPDATA%\ai.deepseek.dsh.desktop
   ```

   （在文件资源管理器地址栏粘贴这一行回车即可打开。）

2. 按你装的杀毒软件操作：

   - **Windows 安全中心（Defender）**：设置 → 隐私和安全性 → Windows 安全中心 → 病毒和威胁防护 → 「病毒和威胁防护设置」下的「管理设置」 → 排除项 → 「添加或删除排除项」 → 添加排除项 → **文件夹**，选中上面那个目录。
   - **360**：设置 → 安全防护中心 → 信任与阻止 → 添加信任目录。
   - **火绒**：设置 → 信任区 → 添加目录。
   - **其他杀毒软件**：在设置里找「白名单 / 信任区 / 排除项」，把同一目录加进去即可。

3. 回到 dsh desktop，再次触发安装（菜单 → **设置…** → 运行环境，重新点「安装 Node」或「安装 dsh」）。这次文件不会再被隔离，安装完成后即可正常启动。

> 这个问题只出现在**应用自己装的 Node 与 dsh** 上。如果你原本就用系统 Node 并自己 `npm install -g` 装了 dsh，那份 dsh 在系统全局目录里，与这里无关。

## 日常使用须知

- **自动运行环境**：若机器上没有可用的 Node，应用会自动弹出「运行环境」面板，一键装好 Node 24。全程不需要管理员权限。装出来的 Node 和 dsh 放在应用自己的数据目录，**不写你的系统 PATH，也不动你已有的任何一个 Node**。
- **快速提问与快捷键**：随时按快捷键（默认 `Ctrl+Alt+Space`，macOS 为 `Ctrl+Option+Q`）呼出极简提问浮窗直接派发任务；主窗口显隐支持全局快捷键（`Ctrl+Alt+D`）。
- **右键即开工作区**：在资源管理器（Windows）、访达（macOS）或文件管理器（Linux）中右键文件夹选择「用 dsh 打开」，即可直接以此文件夹为工作区启动。
- **任务运行防休眠**：长线任务运行期间，应用会自动阻止系统休眠，避免任务中断；跑完后自动恢复。可在设置中随时按需开关。
- **关闭即收进托盘**：点窗口的关闭按钮只会收进托盘常驻，长线任务不中断；彻底退出请用菜单里的「退出 dsh」。
- **静默检查更新**：启动时在后台静默检查，有更新才提示，下载前先征求同意。
