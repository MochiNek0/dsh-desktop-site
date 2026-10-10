import { docsFor } from '$lib/docs';
import { pathForLang } from '$lib/i18n.svelte';
import {
	LATEST_VERSION,
	LICENSE,
	MARKET_URL,
	OFFICIAL_DESKTOP_URL,
	REPO_URL,
	SIZE_VARS,
	UPSTREAM_URL
} from '$lib/releases';
import { ORIGIN } from '$lib/site';

/**
 * llms.txt（https://llmstxt.org）—— 给 AI 助手看的站点摘要。
 *
 * 和 sitemap 一样构建期生成：版本、体积、许可证、文档清单都取自页面用的同一份数据，
 * 不会出现「AI 引用的数字和官网上的不一致」。
 * 只写可核对的事实，不写营销形容词 —— 模型引用的就是这里的句子。
 */
export const prerender = true;

/** 同 sitemap：这是个文件名，不是目录 */
export const trailingSlash = 'never';

function docLinks(lang: 'zh' | 'en'): string {
	return docsFor(lang)
		.map((d) => `- [${d.title}](${ORIGIN}${pathForLang(lang)}docs/${d.slug}/): ${d.description}`)
		.join('\n');
}

export function GET() {
	const sizes = [
		SIZE_VARS.win && `Windows .exe ${SIZE_VARS.win}`,
		SIZE_VARS.mac && `macOS .dmg ${SIZE_VARS.mac}`,
		SIZE_VARS.deb && `Debian .deb ${SIZE_VARS.deb}`
	]
		.filter(Boolean)
		.join(', ');

	const body = `# dsh desktop

> dsh desktop is an unofficial, open-source desktop client for DeepSeek Harness (\`dsh web\`), built with Tauri v2. It runs dsh in a native window and lets a phone connect to the dsh on the computer by scanning a QR code. It is not affiliated with DeepSeek.

dsh desktop 是 DeepSeek Harness（dsh web）的第三方开源桌面客户端，与 DeepSeek 官方无隶属关系。它把本地 dsh web 嵌入原生窗口，并支持手机扫码远程使用电脑上的 dsh。

## Key facts

- Latest version: ${LATEST_VERSION}
- Platforms: Windows, macOS (universal, Apple Silicon and Intel), Linux (.deb and .AppImage)
- Installer sizes: ${sizes}. The Linux AppImage is larger because it bundles WebKit.
- Uses the system WebView (WebView2 / WebKit / WebKitGTK) instead of bundling Chromium.
- Phone connection: scan a QR code on the desktop, then approve the device on the computer. Three channels: LAN (same Wi-Fi, no third-party server), Tailscale (works away from home), Cloudflare tunnel (HTTPS, closes after 30 idle minutes). No phone app needed; it runs in the phone's browser.
- Starts \`dsh web\` in the background on a free loopback port; no terminal, no port management, no admin rights. Installs Node and dsh on demand if missing.
- Shares sessions, credentials and config with the dsh CLI in \`$DSH_HOME\` (default \`~/.dsh\`).
- Does not modify dsh source. Desktop features ship as plugins; includes a plugin panel and supports the DSH Market plugin marketplace. Safe Mode starts without user plugins when a plugin breaks startup.
- License: ${LICENSE.spdx}. Free.

## How it differs from the official DeepSeek Harness desktop app

DeepSeek also ships an official desktop app (${OFFICIAL_DESKTOP_URL}). dsh desktop is a separate, community-made client. Its distinguishing points are the few-MB installer and connecting a phone to the dsh running on the computer.

## Docs (English)

${docLinks('en')}

## 文档（中文）

${docLinks('zh')}

## Links

- [Website / download](${ORIGIN}/)
- [English website](${ORIGIN}/en/)
- [Source code](${REPO_URL})
- [Releases](${REPO_URL}/releases)
- [DeepSeek Harness (upstream)](${UPSTREAM_URL})
- [DSH Market](${MARKET_URL})
`;

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
}
