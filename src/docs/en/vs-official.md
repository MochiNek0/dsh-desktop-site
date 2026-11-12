---
title: dsh desktop vs the official app
headTitle: dsh desktop vs the official DeepSeek Harness app
description: How dsh desktop differs from the official DeepSeek Harness desktop app across supported platforms, installer size, shortcuts, phone access and license, and which one to pick for your situation.
order: 6
---

DeepSeek ships an official DeepSeek Harness desktop app. dsh desktop is a separate, community-made client with no affiliation with DeepSeek. You can install both on the same computer.

## Comparison

The official-app column is taken from the [DeepSeek Harness website](https://www.deepseek.com/harness/); installer sizes are those of the files at its download links on November 12, 2026. If the website has changed since, it takes precedence.

| | dsh desktop | Official desktop app |
| --- | --- | --- |
| Made by | Community (third party, open source) | DeepSeek |
| Status | Stable release | Preview |
| Windows | Yes (x64) | Yes (64-bit) |
| macOS | Yes (universal: Apple Silicon and Intel) | Yes (Apple silicon, macOS 13 or later) |
| Linux | Yes (.deb / .AppImage) | Not mentioned on the website |
| Installer size | About 2.7 MB on Windows, 6.7 MB on macOS, 4.4 MB on Debian | About 280 MB on Windows, 256 MB on macOS |
| Phone access | Yes: LAN, Tailscale, Cloudflare tunnel | Not mentioned on the website |
| Quick Ask & global shortcuts | Yes (Quick Ask overlay, window toggle, instant paste) | Not mentioned on the website |
| Workspace integration | Yes (Right-click folders, CLI & dsh-desktop:// protocol) | Not mentioned on the website |
| Keep-awake during runs | Yes (prevents sleep during active turns) | Not mentioned on the website |
| Scheduled & automated tasks | Yes (built into dsh web, so both have it) | Yes |
| Tray session management | Yes (lists active/waiting sessions, icon status badges) | Basic tray only |
| Plugins | Yes, plus desktop panel, DSH Market, and local folder linking | Yes |
| License | AGPL-3.0 | MIT |

## How dsh desktop works

dsh desktop does not modify dsh. It starts a local `dsh web` in the background and embeds that page in a native window, so the interface and features are those of the dsh web version you have installed. Sessions, credentials and config live in `$DSH_HOME` (default `~/.dsh`), shared with the dsh CLI.

This also decides which features come "built in". Anything dsh web already has, dsh desktop has too — and so does the official desktop app, since it runs the same dsh web:

- The plugin system, including "creation mode" that builds plugins through conversation
- Scheduled and automated tasks
- Finishing all kinds of tasks (documents, spreadsheets, code, local file read/write, background runs)
- Terminal, the agent loop, sub-agents, and developer tools such as execution traces
- Experimental: agent teams, auto-authorization review, voice input

The following are what dsh desktop adds on top of the native window. Opening dsh web in a browser gives you none of these, and they are the main differences from the official desktop app:

- Phone remote access
- Tray session management and status badges
- Quick Ask and global shortcuts
- Right-click folder access and the `dsh-desktop://` protocol
- Keep-awake during runs
- An isolated environment-variable terminal

It uses the system WebView (WebView2 on Windows, WebKit on macOS, WebKitGTK on Linux) rather than bundling a browser engine, which is why the installers are a few MB. The Linux AppImage bundles WebKit and is larger.

## Which one to pick

- You want the client made by DeepSeek itself: use the [official desktop app](https://www.deepseek.com/harness/).
- You want phone remote access, Linux support, Quick Ask & global shortcuts, right-clicking folders to open workspaces, or care about installer size: use dsh desktop.

Both work alongside the `dsh` in your terminal. For more details, see [Shortcuts & Workspaces](../shortcuts/) and [Phone connection](../phone-connection/).
