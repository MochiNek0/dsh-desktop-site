---
title: dsh desktop vs the official app
description: How dsh desktop differs from the official DeepSeek Harness desktop app in platforms, size, phone access and license, and which one to pick.
order: 5
---

DeepSeek ships an official DeepSeek Harness desktop app. dsh desktop is a separate, community-made client with no affiliation with DeepSeek. You can install both on the same computer.

## Comparison

The official-app column is taken from the [DeepSeek Harness website](https://www.deepseek.com/harness/); installer sizes are those of the files at its download links on September 29, 2026. If the website has changed since, it takes precedence.

| | dsh desktop | Official desktop app |
| --- | --- | --- |
| Made by | Community (third party) | DeepSeek |
| Status | Stable release | Preview |
| Windows | Yes (x64) | Yes (64-bit) |
| macOS | Yes (universal: Apple Silicon and Intel) | Yes (Apple silicon) |
| Linux | Yes (.deb / .AppImage) | Not mentioned on the website |
| Installer size | About 2.5 MB on Windows, 6.3 MB on macOS, 4.1 MB on Debian | About 276 MB on Windows, 353 MB on macOS |
| Phone access to the dsh on your computer | Yes: LAN, Tailscale, Cloudflare tunnel | Not mentioned on the website |
| Plugins | Yes, plus a desktop plugin panel that installs from DSH Market | Yes |
| License | AGPL-3.0 | MIT |

## How dsh desktop works

dsh desktop does not modify dsh. It starts a local `dsh web` in the background and embeds that page in a native window, so the interface and features are those of the dsh web version you have installed. Features built into dsh web, such as the "creation mode" that builds plugins through conversation, are available in both. Sessions, credentials and config live in `$DSH_HOME` (default `~/.dsh`), shared with the dsh CLI.

It uses the system WebView (WebView2 on Windows, WebKit on macOS, WebKitGTK on Linux) rather than bundling a browser engine, which is why the installers are a few MB. The Linux AppImage bundles WebKit and is larger.

## Which one to pick

- You want the client made by DeepSeek itself: use the [official desktop app](https://www.deepseek.com/harness/).
- You want to keep using your computer's dsh from your phone, you are on Linux, or installer size matters: use dsh desktop.

Both work alongside the `dsh` in your terminal. For phone access, see [Phone connection](../phone-connection/).
