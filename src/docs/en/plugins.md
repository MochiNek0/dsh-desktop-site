---
title: Plugins
description: Installing and managing plugins, Safe Mode for when one breaks, and allowing builds for github plugins.
order: 3
---

The desktop app does not modify a single line of dsh. Every desktop capability ships as a plugin — remove them and you are back to plain dsh.

## Install and manage

From the plugin panel you can install from curated presets or [DSH Market](https://dshmarket.com), or enter an npm package name or a GitHub repo (e.g. `github:owner/repo`). When an installed plugin has a newer version, its card shows an “Update to x.x.x” button.

## Safe Mode

Plugins load before dsh web binds its port. If one crashes and the app stalls on the loading page, the loading page offers “Start without plugins”: user plugins are set aside, the app starts cleanly, and you can uninstall the culprit from the panel. “Reload plugins” in the menu puts the rest back.

## Isolated env terminal

Menu → Open Terminal launches a shell with the dsh environment variables already set — handy for debugging, and it leaves your global PATH untouched.

## github: plugins blocked during install

pnpm blocks build scripts from git sources by default. If installing a `github:` plugin errors out, follow the panel’s prompt and allow that package in this file:

```text
$DSH_HOME/profiles/web/pnpm-workspace.yaml
```
