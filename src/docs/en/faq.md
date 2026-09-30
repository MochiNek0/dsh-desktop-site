---
title: FAQ
description: Where dsh desktop comes from, what it needs, why it is small, compatibility, and where to get help.
order: 4
---

## Is dsh desktop an official DeepSeek product?

No. This is a third-party, open-source desktop client built on DeepSeek Harness. It has no affiliation with DeepSeek, and its source is fully open on GitHub. If you would like to try the official desktop app, visit the [DeepSeek Harness official website](https://www.deepseek.com/harness/).

## Do I need Node.js and dsh installed first?

No. The app detects your environment: if a suitable Node and dsh exist it uses them; otherwise the Runtime panel pops up to install Node 24 and dsh in one click, without admin rights.

## Why are the installers so small (from 2.5 MB)?

It is built on Tauri v2 and uses the operating system’s native WebView engine (WebView2 on Windows, WebKit on macOS, WebKitGTK on Linux) instead of bundling a 100+ MB Chromium runtime, which dramatically reduces memory and disk footprint.

## What if a broken plugin crashes the app on launch?

Use Safe Mode: plugins load before dsh web binds its port. If one crashes, the loading page offers “Start without plugins” to set user plugins aside, launch cleanly, and let you uninstall the culprit from the panel. See [Plugins](../plugins/).

## Will it conflict with the dsh in my terminal?

Not at all. It allocates dynamic loopback ports, so it can run alongside manual CLI instances without collision. It also never rewrites your global PATH.

## Where are sessions and config stored? What env vars are supported?

Data is shared with the CLI under `$DSH_HOME` (default `~/.dsh`). `DSH_BIN` points at an absolute dsh executable path (highest priority, skips the Node version check); `DSH_HOME` sets the root data and config directory.

## Does it auto-update?

Yes. The app checks silently on launch, tells you only when an update exists, and asks before downloading. On Linux, the AppImage build has the fullest self-update support.

## Which platforms are supported?

Windows (`.exe`), macOS (`.dmg` universal binary for Apple Silicon and Intel), and Linux (`.deb` and `.AppImage`). Windows, macOS, and Debian-based Linux are verified.

## Is there a community group or feedback channel?

Join the QQ group 1125671315 for discussion, bug reports and suggestions, or open an Issue on [GitHub](https://github.com/MochiNek0/dsh-desktop/issues) anytime.
