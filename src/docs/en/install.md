---
title: Installation
description: How to install on each platform, what may block the first launch, and a few everyday notes.
order: 1
---

## Windows

The installer is an `.exe` (NSIS). It needs WebView2 and bootstraps it automatically if missing (verified). On first run it fetches core components if your environment lacks them — after that it just opens, nothing to configure.

## macOS

A universal binary for Apple Silicon and Intel. If macOS blocks the first launch, right-click the app in Finder and choose “Open”, or clear the quarantine flag from a terminal:

```bash
xattr -dr com.apple.quarantine /Applications/dsh-desktop.app
```

## Linux

AppImage is recommended for full self-update support (verified on Debian-based distros). Make it executable after downloading:

```bash
chmod +x dsh-desktop_*_amd64.AppImage
./dsh-desktop_*_amd64.AppImage
```

On Debian / Ubuntu you can also install the smaller `.deb` package.

## Slow npm downloads in China

The first launch pulls dsh components from npm. If that is slow, point npm at a faster domestic registry:

```bash
npm config set registry https://registry.npmmirror.com
```

Since v0.1.19 you can also pick the registry in the app under “Settings…” — keep your system `.npmrc`, or let it test mirrors and use the fastest.

## Everyday notes

- **Runtime auto-detection**: if no usable Node is found, the Runtime panel opens by itself and installs Node 24 in one click. No admin rights needed at any point.
- **Close to tray**: closing the window parks the app in the tray so in-flight tasks keep running. Use “Quit dsh” in the menu to exit.
- **Silent update checks**: checked quietly on launch, raised only when there is one, and downloaded only with your consent.
