---
title: Plugins
headTitle: DeepSeek Harness plugins & Safe Mode
description: Online marketplace, local folder install, update badges, and Safe Mode.
order: 4
---

The desktop app does not modify a single line of dsh. Every desktop capability ships as a plugin — remove them and you are back to plain dsh.

## Install and manage

The plugin management panel supports multiple installation sources:

- **Presets & Marketplace**: Install in one click from curated presets or [DSH Market](https://dshmarket.com).
- **Local folders & archives**: Click “Choose a local folder” or “Choose a .tgz” to select local files via the system picker. Folders install as `link:` references (live edits reflect immediately, ideal for local plugin authoring and testing); `.tgz` archives install as `file:` copies.
- **Package specifier**: Enter an npm package name or a GitHub repo directly (e.g. `github:owner/repo`).

## Update notifications & badges

The app checks for plugin updates in the background on launch and when visiting the plugin panel. When updates are found, an update badge appears on the titlebar menu button and in the settings entry. Each plugin card provides an “Update to x.x.x” button.

## Safe Mode

Plugins load before dsh web binds its port. If one crashes and the app stalls on the loading page, the loading page offers “Start without plugins”: user plugins are set aside, the app starts cleanly, and you can uninstall the culprit from the panel. “Reload plugins” in the menu puts the rest back.

## Isolated env terminal

Menu → Open Terminal launches a shell with the dsh environment variables already set — handy for debugging, and it leaves your global PATH untouched.

## github: plugins blocked during install

pnpm blocks build scripts from git sources by default. If installing a `github:` plugin errors out, follow the panel’s prompt and allow that package in this file:

```text
$DSH_HOME/profiles/web/pnpm-workspace.yaml
```
