---
title: Phone connection
description: Scan once to reach the dsh on your computer from your phone — choosing a channel, and a few things worth knowing.
order: 2
---

Phone connection needs dsh desktop v0.1.20 or later; until that ships as a stable release, grab a [pre-release build](https://github.com/MochiNek0/dsh-desktop/releases).

Open dsh desktop on your computer and click “Phone connection” in the title bar — the card shows a QR code. Scan it with your phone, confirm on the computer, and you are in the dsh session. After that, just tap through from the [connection portal](/en/go/) — no more scanning.

## Three channels

Pick one on the card:

- **Local network** — phone and computer on the same Wi-Fi. Plain HTTP, and it stops working once you leave that network.
- **Tailscale** — you are out, and both sides are signed in to the same tailnet. Needs the Tailscale client; the link is encrypted by WireGuard.
- **Cloudflare tunnel** — needs your own domain and `cloudflared`. Reachable from any network, and the only one of the three with TLS. It opens this computer to the public internet, so it never starts on launch and shuts itself down after 30 idle minutes.

## A few things worth knowing

- The portal cannot tell which channel is reachable right now — browsers do not let an HTTPS page probe local network addresses. So the call is yours: local network at home, Tailscale or public when you are out.
- You may still have to pair once after jumping across — session credentials are stored per address, and the portal cannot supply them. Follow the prompt there and type in the six-character code from your computer.
- The list of machines lives in this browser only; there is no copy on our server. Clearing site data or switching phones means scanning again.
- On iOS, connecting from a home-screen icon jumps out to Safari, because your computer is a different site and falls outside the portal’s scope. That is system behaviour and cannot be changed.
