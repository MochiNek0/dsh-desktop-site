---
title: Code signing and privacy
headTitle: dsh desktop code signing policy and privacy statement
description: How dsh desktop installers are built and who signs them, and when the app goes online and what it sends.
order: 7
---

## Code signing policy

Free code signing for the Windows build is provided by [SignPath.io](https://about.signpath.io/), certificate by [SignPath Foundation](https://signpath.org/). (Application pending; releases published after approval will be signed.)

- Every installer is built automatically by [GitHub Actions](https://github.com/MochiNek0/dsh-desktop/actions) from the [public source](https://github.com/MochiNek0/dsh-desktop), never on a personal machine.
- Only binaries built by this project are signed.
- Every signing request is approved by hand by the approver listed below.

### Team roles

| Role | Members |
| --- | --- |
| Committers and reviewers | [MochiNek0](https://github.com/MochiNek0) |
| Approvers | [MochiNek0](https://github.com/MochiNek0) |

Outside contributions arrive as pull requests and are reviewed by the reviewers above before they are merged.

## Privacy statement

Apart from the cases listed below, this program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it. The app collects no usage statistics, sends no crash reports, and has no accounts.

**Checks made automatically at startup**

- **App update check**: requests `https://dsh-desktop.cc.cd/updater/latest.json` (falling back to the same file on GitHub Releases) and compares version numbers. You are only told when there is a newer version, and asked before anything is downloaded.
- **dsh update check**: asks for dsh's latest version with `npm view @deepseek-ai/dsh dist-tags` on this machine, against the registry configured in npm; unless you chose to use only your own registry, npmmirror is asked at the same time.
- **Phone stylesheet patch**: only when you have switched the phone style patch on, requests `https://dsh-desktop.cc.cd/mobile-css/patches.json` and verifies its signature.

These requests carry only what any HTTP request does (such as the IP address and User-Agent), and no data about you, your computer or your sessions.

**Only when you ask for it**

- **Installing the runtime**: when Node or dsh is missing, and after you confirm, Node is downloaded from the official Node.js source or a mirror, and dsh is installed with npm.
- **Installing plugins**: when you press install in the plugin panel, the plugin is downloaded from npm or wherever it is hosted.
- **Phone access**: LAN mode goes through no third-party server; Tailscale and Cloudflare modes relay through your own Tailscale network and your own Cloudflare tunnel (`cloudflared`).

dsh itself (the separate program installed by `npm install -g @deepseek-ai/dsh`) connects to the model providers you configure. That is covered by the privacy policies of dsh and those providers, and does not pass through this app.
