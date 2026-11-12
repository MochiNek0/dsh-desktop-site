---
title: Installation
headTitle: Install dsh desktop on Windows, macOS & Linux
description: How to install dsh desktop on Windows, macOS and Linux, how the runtime is detected for you, what may block the first launch and how to clear it, what to do when the dsh the app installs is quarantined by antivirus, and a few everyday notes worth knowing before you start.
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

### Install stalls / progress bar stuck at 0: a leftover npm proxy

**Symptoms**: on the command line, `npm install -g` fails with `ETIMEDOUT` or `network request to ... failed`; inside dsh desktop, the “Install dsh / Install Node” progress bar stays at 0, cycling between mirrors and never finishing. The usual cause is a leftover **global proxy** in npm: it intercepts every request, but the proxy itself (or the port it listens on) is unreachable from your network. The `IP:port` in the CLI error is usually this proxy address, not the registry you picked.

**Diagnose** — check the proxy npm is actually using:

```powershell
npm config get proxy
npm config get https-proxy
```

If either has a value, that is almost certainly the cause.

**Fix** — clear the proxy:

```powershell
npm config delete proxy
npm config delete https-proxy
```

The proxy may also come from environment variables; clear those too:

```powershell
$env:HTTP_PROXY=""
$env:HTTPS_PROXY=""
$env:ALL_PROXY=""
```

Then trigger the install again from dsh desktop.

> Note: if the leftover proxy was not set by you, clear it before installing so npm traffic does not keep routing through an unknown node.

## Fails to start after install: blocked by antivirus

If your machine had no Node, dsh desktop installs Node 24 and dsh into its own directory via the Runtime panel (about 185 MB). npm drops a batch of `.exe`, `.cmd` and script files along the way, and **Windows Security (Defender), 360, Huorong and other antiviruses sometimes scan and quarantine them moments after they are written** — once `node.exe`, `dsh.cmd` or a package file is taken away, the app reports “dsh failed to start” or stalls on the loading page.

How to tell it is this case: the app shows a dialog listing **the files that have since disappeared**, and points you at the app data directory to add to your antivirus exclusions. If the install itself was interrupted, the message usually also mentions `EPERM` or `EBUSY`.

To fix it — add the app data directory to your antivirus exclusions (allowlist), then install again:

1. Find the app data directory. It is the path shown in the prompt at install time, typically:

   ```text
   %LOCALAPPDATA%\ai.deepseek.dsh.desktop
   ```

   (Paste this into the File Explorer address bar and press Enter to open it.)

2. Depending on your antivirus:

   - **Windows Security (Defender)**: Settings → Privacy & security → Windows Security → Virus & threat protection → “Manage settings” under Virus & threat protection settings → Exclusions → “Add or remove exclusions” → Add an exclusion → **Folder**, and pick the directory above.
   - **360**: Settings → Security Protection Center → Trust & Block → Add a trusted directory.
   - **Huorong**: Settings → Trust Zone → Add directory.
   - **Other antiviruses**: look for “allowlist / trust zone / exclusions” in the settings and add the same directory.

3. Back in dsh desktop, trigger the install again (Menu → **Settings…** → Runtime, click “Install Node” or “Install dsh” again). This time the files are not quarantined, and the app starts normally once it finishes.

> This only affects the Node and dsh **the app installed itself**. If you already use a system Node and installed dsh yourself with `npm install -g`, that dsh lives in the system global directory and is unrelated to this.

## Everyday notes

- **Runtime auto-detection**: if no usable Node is found, the Runtime panel opens by itself and installs Node 24 in one click. No admin rights needed at any point. The Node and dsh it installs go into the app's own data directory — **it never writes your system PATH, and leaves every Node you already have alone**.
- **Quick Ask & shortcuts**: hit the global shortcut (`Ctrl+Alt+Space`, macOS `Ctrl+Option+Q`) anytime to summon the lightweight Quick Ask overlay; toggle main window visibility with `Ctrl+Alt+D`.
- **Open workspaces from context menu**: right-click any folder in Windows Explorer, macOS Finder, or Linux file managers and choose “Open with dsh” to launch straight into that workspace.
- **Keep-awake during tasks**: while a task is running, dsh desktop prevents system sleep to avoid interrupted long turns, and releases it automatically when done (toggleable in Settings).
- **Close to tray**: closing the window parks the app in the tray so in-flight tasks keep running. Use “Quit dsh” in the menu to exit.
- **Silent update checks**: checked quietly on launch, raised only when there is one, and downloaded only with your consent.
