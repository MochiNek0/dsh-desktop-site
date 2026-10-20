---
title: 代码签名与隐私
headTitle: dsh desktop 代码签名政策与隐私说明
description: dsh desktop 安装包怎么构建、由谁签名，以及应用会在什么时候联网、联网时发送什么。
order: 7
---

## 代码签名政策

Windows 版的免费代码签名由 [SignPath.io](https://about.signpath.io/) 提供，证书由 [SignPath Foundation](https://signpath.org/) 颁发。（申请中，通过后发布的版本开始带签名。）

- 所有安装包都由 [GitHub Actions](https://github.com/MochiNek0/dsh-desktop/actions) 从 [公开源码](https://github.com/MochiNek0/dsh-desktop) 自动构建，不在个人电脑上打包。
- 只签本项目自己构建的程序。
- 每一次签名都要经过下面的批准人手动批准。

### 团队与角色

| 角色 | 成员 |
| --- | --- |
| 提交者与审阅者（Committers and reviewers） | [MochiNek0](https://github.com/MochiNek0) |
| 批准人（Approvers） | [MochiNek0](https://github.com/MochiNek0) |

外部贡献以 Pull Request 提交，合并前由上面的审阅者审查。

## 隐私说明

除下面列出的情况外，本程序不会向其他联网系统传输任何信息，除非用户或安装、运行本程序的人明确要求。应用不收集使用统计、不上报崩溃信息，也没有任何账号系统。

**启动时自动进行的检查**

- **应用更新检查**：请求 `https://dsh-desktop.cc.cd/updater/latest.json`（取不到时改用 GitHub Releases 上的同名文件），比较版本号。有新版本才提示，下载前会先征求同意。
- **dsh 更新检查**：通过本机的 `npm view @deepseek-ai/dsh dist-tags` 查询 dsh 的最新版本，使用你在 npm 里配置的源；没有指定只用自己的源时，会同时询问 npmmirror。
- **手机界面样式补丁**：只在你打开了手机样式补丁开关时，请求 `https://dsh-desktop.cc.cd/mobile-css/patches.json` 并校验签名。

这些请求只发送普通的 HTTP 请求信息（如 IP 地址、User-Agent），不附带任何关于你、你的电脑或你的会话的数据。

**你主动操作时才会联网**

- **安装运行环境**：缺少 Node 或 dsh 时，在你确认后从 Node.js 官方源或国内镜像下载 Node，并用 npm 安装 dsh。
- **安装插件**：在插件面板里点安装时，从 npm 或插件所在的地址下载。
- **手机连接**：局域网模式不经过任何第三方服务器；Tailscale 和 Cloudflare 模式分别通过你自己的 Tailscale 网络和你自己的 Cloudflare 隧道（`cloudflared`）转发。

dsh 本身（由 `npm install -g @deepseek-ai/dsh` 安装的独立程序）会连接你配置的模型服务商，那部分遵循 dsh 和对应服务商的隐私政策，不经过本应用。
