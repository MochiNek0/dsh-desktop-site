---
title: FAQ
headTitle: DeepSeek Harness desktop client FAQ
description: Where dsh desktop comes from, what it needs, shortcuts, workspaces, compatibility, and where to get help.
order: 5
---

## Is dsh desktop an official DeepSeek product?

No. This is a third-party, open-source desktop client built on DeepSeek Harness. It has no affiliation with DeepSeek, and its source is fully open on GitHub. If you would like to try the official desktop app, visit the [DeepSeek Harness official website](https://www.deepseek.com/harness/). For how the two differ, see [dsh desktop vs the official app](../vs-official/).

## Do I need Node.js and dsh installed first?

No. The app detects your environment: if a suitable Node and dsh exist it uses them; otherwise the Runtime panel pops up to install Node 24 and dsh in one click, without admin rights.

## Why are the installers so small (from 2.5 MB)?

It is built on Tauri v2 and uses the operating system’s native WebView engine (WebView2 on Windows, WebKit on macOS, WebKitGTK on Linux) instead of bundling a 100+ MB Chromium runtime, which dramatically reduces memory and disk footprint.

## How do I trigger the Quick Ask box and customize global shortcuts?

Press `Ctrl+Alt+Space` (macOS `Ctrl+Option+Q`) to summon the minimalist Quick Ask overlay anywhere to dispatch tasks, select workspaces, or switch models. Under Menu → **Settings…** (Shortcuts group), you can customize global shortcuts for window visibility, quick ask, and clipboard pasting (at least two modifier keys required). See [Shortcuts & Workspaces](../shortcuts/).

## Why don't global shortcuts work on Linux?

Global shortcuts rely on low-level OS event hooks. Under traditional X11 sessions, they work out of the box. Under Linux Wayland, the compositor restricts background applications from capturing global keystrokes for security reasons. To use global shortcuts on Linux, switch to an X11 desktop session.

## Can I open a workspace from links or automated scripts?

Yes. The application registers the `dsh-desktop://open?path=<path>` protocol handler. Clicking such a link in your browser, notes, or external automation scripts immediately launches the app and navigates to the specified workspace folder.

## Will the computer sleep while a long task is executing?

No. dsh desktop includes automatic Keep-Awake protection: whenever a turn is running, the app requests the operating system to prevent sleep mode. Normal power settings are restored automatically when the turn completes or asks for user confirmation. You can toggle this setting anytime on the Settings card.

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
