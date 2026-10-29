---
title: Shortcuts & Workspaces
headTitle: dsh Quick Ask, shortcuts & workspaces
description: Quick Ask overlay, multi-slot global shortcuts, opening folders from file managers and custom protocols, plus tray session management and keep-awake.
order: 3
---

dsh desktop provides global shortcuts, a lightweight Quick Ask box, and system-level workspace integration so you never need to juggle terminal windows or manually navigate directories.

## Quick Ask box

Press the global shortcut (default `Ctrl+Alt+Space`, macOS `Ctrl+Option+Q`) anytime to summon a minimalist prompt box in the center of your screen.

- **No need to open the main window**: Type your prompt directly into the input and press Enter to dispatch. The box dismisses itself automatically.
- **Switch workspaces and sessions**: Interactive chips below the input let you choose a workspace (recent folders or any local directory picked via the native file dialog), target an existing session or start fresh, and switch the model.
- **Background execution & notifications**: Tasks execute quietly in the background. When a turn completes or asks for approval, a system notification alerts you — clicking the notification jumps directly into the relevant session.

## Global shortcuts

Under Menu → **Settings…** (Shortcuts group), three independent shortcut slots can be recorded:

1. **Show / Hide Main Window**: Default `Ctrl+Alt+D` (macOS `Ctrl+Option+D`).
2. **Quick Ask Box**: Default `Ctrl+Alt+Space` (macOS `Ctrl+Option+Q`).
3. **Paste Clipboard into Current Session**: Unassigned by default. When pressed, system clipboard text is instantly filled into the active input box without manual focusing.

> **Recording note**: Combinations require at least two modifier keys (e.g. Ctrl, Alt/Option, Shift). If a combination is already grabbed by another program, the settings card states the reason; registration errors on launch are also reported via notification.
> 
> *Note: Due to compositor limitations, global shortcuts are currently unavailable under Linux Wayland.*

## Open workspaces from anywhere

Open any folder as a dsh workspace through native OS integrations, whether the app is already open or closed:

- **File manager context menus**:
  - **Windows**: Right-click any folder or empty area and select “Open with dsh” (under “Show more options” on Windows 11).
  - **macOS**: Drag a folder onto the dsh Dock icon, or right-click in Finder and choose “Open With” → dsh desktop.
  - **Linux**: With the `.deb` package installed, select dsh in the file manager’s “Open With Other Application” menu.
- **Command-line launch**: Run `dsh-desktop <path>` in your terminal to open that workspace immediately (relative paths supported; file paths open their parent directory).
- **Custom protocol handler**: Links formatted as `dsh-desktop://open?path=<path>` can be clicked from browsers, documents, or external scripts to open the workspace.
- **Recent workspaces**: The tray menu pins your 5 most recent workspaces for one-click access, mirrored in the Windows Taskbar right-click menu (Jump List).

## Tray session management & keep-awake

- **Active session list**: The top of the tray menu lists sessions that are currently waiting for confirmation or executing, letting you switch directly.
- **Status badges**: An icon dot in the system tray shows **blue** when busy and **orange** when waiting for your input (Windows taskbar icons show a matching badge).
- **Keep-awake during runs**: While a task is active, dsh desktop prevents your machine from sleeping so long-running operations are not interrupted. Sleep is released as soon as the turn finishes. This can be toggled on the settings card anytime.
