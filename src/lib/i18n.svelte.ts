/**
 * 极简 i18n：一份字典 + 一个 Svelte 5 runes store。
 *
 * 不引入 i18n 库的理由：本站只有一页 + 一个 404，文案是静态的。
 *
 * 语言由**路由**决定，不由 localStorage 决定：中文在 `/`，英文在 `/en/`。
 * 之前是单 URL + 客户端切换，代价是英文文案根本进不了预渲染的 HTML ——
 * 爬虫只看得到中文，这 126 条英文翻译对搜索引擎等于不存在。
 *
 * 所以这里只留一个「当前语言」的容器，由根 layout 从路由参数写入；
 * 没有探测、没有持久化、没有重定向（那会让 `/` 分享出去后变成另一种语言）。
 */

export type Lang = 'zh' | 'en';

export const LANGS: Lang[] = ['zh', 'en'];

type Dict = Record<string, string>;

const zh: Dict = {
	// ── 站点/导航 ──
	'site.title': 'dsh desktop — DeepSeek Harness 桌面客户端',
	'site.desc':
		'dsh desktop 是 DeepSeek Harness（dsh web）的跨平台桌面客户端。自动拉起本地服务并内嵌原生窗口，无需终端与端口管理。支持 Windows、macOS、Linux，国内高速下载。',

	'nav.features': '特性',
	'nav.download': '下载',
	'nav.plugins': '插件',
	'nav.faq': '常见问题',
	'nav.github': 'GitHub',
	'nav.menu': '打开菜单',
	'nav.lang': '切换语言',

	// ── Hero ──
	'hero.badge': '基于 Tauri v2 · 开源 MIT',
	'hero.title1': '把',
	'hero.titleCode': 'dsh web',
	'hero.title2': '装进桌面',
	'hero.sub':
		'启动即自动在后台拉起本地 dsh web 服务，并内嵌到原生桌面窗口。不用开终端，不用管端口，会话与配置和 CLI 完全共享。',
	'hero.cta': '免费下载',
	'hero.ctaSub': '国内高速源 · 免登录',
	'hero.cta2': '在 GitHub 上查看',
	'hero.version': '最新版本',
	'hero.platforms': 'Windows · macOS · Linux',
	'hero.free': '完全免费开源',

	// ── 特性 ──
	'feat.heading': '为什么用桌面版',
	'feat.sub': '同一个 dsh，去掉每天都要重复的那几步。',

	'feat.1.title': '开箱即用',
	'feat.1.body':
		'自动检测并配置 Node.js 与 dsh 运行环境，不需要管理员权限。第一次启动会把机器上找得到的 Node 列出来，由你决定用哪个。',
	'feat.2.title': '无感共存',
	'feat.2.body':
		'动态端口分配，与你在终端里手动跑的 dsh web 互不干扰。两个可以同时开着。',
	'feat.3.title': '轻量原生',
	'feat.3.body':
		'现代无边框 UI，跟随系统深色/浅色主题，中英文双语界面，系统级消息通知，支持开机自启。',
	'feat.4.title': '环境共享',
	'feat.4.body':
		'与全局终端共用同一个 dsh 命令，跟着你的 PATH 走。支持启动检查与一键无缝升级。',
	'feat.5.title': '可视化插件管理',
	'feat.5.body':
		'内置插件面板，一键安装/卸载，不必配置终端。也提供自带正确环境变量的终端入口，不污染系统 PATH。',
	'feat.6.title': '稳定守护',
	'feat.6.body':
		'单实例进程守护，退出时自动回收所有子进程。dsh web 意外退出会自动返回加载页并提供重启。',

	// ── 截图 ──
	'shot.heading': '界面预览',
	'shot.sub': '原生窗口里的完整 dsh web 体验。',
	'shot.alt': 'dsh desktop 应用界面预览',

	// ── 下载 ──
	'dl.heading': '下载 dsh desktop',
	'dl.sub': '选择你的系统。国内用户建议使用加速源，速度通常远快于 GitHub 直连。',
	'dl.detected': '检测到你的系统',
	'dl.recommendedForYou': '为你推荐',
	'dl.otherPlatforms': '其他平台',
	'dl.source': '下载源',
	'dl.sourceHint': '换一个源',
	'dl.copy': '复制链接',
	'dl.copied': '已复制',
	'dl.copyFail': '复制失败，请手动复制',
	'dl.button': '下载',
	'dl.size': '体积',
	// 与 formatCount 拼成「364 次 GitHub 下载」——
	// 口径写死在文案里：这是 GitHub 侧计数，不是安装量
	'dl.downloads': '次下载',
	'dl.downloadsCadence': '每 24 小时更新',
	'dl.downloadsNote': '含所有下载源、已去重的估算值。每 24 小时汇总一次。其中 GitHub 侧',
	'dl.checksum': '校验与签名文件',
	'dl.allAssets': '查看全部安装包与更新日志',
	'dl.mirrorTip':
		'加速源由第三方社区提供，仅代理 GitHub 流量，本站不托管安装包。若某个源失效，请换一个再试。',

	'os.windows': 'Windows',
	'os.macos': 'macOS',
	'os.linux': 'Linux',

	'status.verified': '已验证',
	'status.untested': '暂未验证，欢迎反馈',
	'status.partial': 'Debian 系已验证',

	'dl.win.exe': 'Windows 安装包',
	'dl.win.exe.tab': '.exe',
	'dl.win.exe.note': '.exe · 需要 WebView2（缺失会自动引导下载）',
	'dl.mac.dmg': 'macOS 磁盘映像',
	'dl.mac.dmg.tab': '.dmg',
	'dl.mac.dmg.note': '.dmg · 通用二进制，原生支持 Apple Silicon 与 Intel',
	'dl.linux.appimage': 'Linux AppImage',
	'dl.linux.appimage.tab': 'AppImage',
	'dl.linux.appimage.note': '.AppImage · 推荐，支持完整自动更新',
	'dl.linux.deb': 'Linux Deb 包',
	'dl.linux.deb.tab': '.deb',
	'dl.linux.deb.note': '.deb · 适用于 Debian / Ubuntu',
	'dl.pickFormat': '选择安装包格式',

	'mirror.ghproxy': '社区加速 · 国内推荐',
	'mirror.ghfast': '社区加速 · 备用',
	'mirror.ghproxycom': '社区加速 · 备用',
	'mirror.llkk': '社区加速 · 备用',
	'mirror.direct': '官方直连 · 国内可能较慢',

	// ── 安装提示 ──
	'tip.heading': '安装提示',
	'tip.win.title': 'Windows',
	'tip.win.body':
		'首次启动若未检测到本地环境，需要联网拉取 dsh 核心组件，请保持网络连通。若系统缺少 WebView2，安装器会自动引导下载。',
	'tip.win.ready': '即开即用 —— 无需手动配置',
	'tip.mac.title': 'macOS 首次运行被拦截',
	'tip.mac.body':
		'在访达中右键点击应用选择「打开」，或在终端执行以下命令解除隔离：',
	'tip.linux.title': 'Linux',
	'tip.linux.body':
		'推荐 AppImage 以获得完整自更新支持。下载后需要赋予可执行权限：',
	'tip.cn.title': '国内网络建议',
	'tip.cn.body':
		'应用首次启动需要从 npm 拉取 dsh 组件。若下载缓慢，可先为 npm 配置国内镜像：',

	// ── 插件 ──
	'plug.heading': '插件，不用碰命令行',
	'plug.sub': '菜单 → 插件… 打开可视化面板。',
	'plug.1.title': '一键安装',
	'plug.1.body': '从预设列表直接安装，或手动填 npm 包名 / GitHub 仓库地址（如 github:owner/repo）。',
	'plug.2.title': '原生终端入口',
	'plug.2.body': '菜单 → 打开终端，启动一个已配好 dsh 环境变量的终端，不污染系统全局 PATH。',
	'plug.note':
		'提示：安装 github: 形式的插件时，pnpm 出于安全考虑默认会拦截构建脚本。如遇报错，请按面板提示打开插件目录，在 $DSH_HOME/profiles/web/pnpm-workspace.yaml 的 allowBuilds 中放行该插件。',

	// ── FAQ ──
	'faq.heading': '常见问题',
	'faq.q1': 'dsh desktop 是 DeepSeek 官方产品吗？',
	'faq.a1':
		'不是。本项目是基于 DeepSeek Harness 开发的第三方开源桌面客户端，与 DeepSeek 官方没有隶属或合作关系，仅供学习与便利使用。',
	'faq.q2': '需要先安装 Node.js 和 dsh 吗？',
	'faq.a2':
		'不需要。应用会自动检测环境：如果机器上已有合适的 Node 和 dsh 就直接用；如果没有，它会把找得到的 Node 列出来，由你决定用哪个，或者下载一份新的（Node 和 dsh 约 185 MB）。全程不需要管理员权限。',
	'faq.q3': '会和我终端里的 dsh 冲突吗？',
	'faq.a3':
		'不会。应用采用动态端口分配，可以和终端里手动运行的 dsh web 同时开着。它也不会改写你的 PATH —— 你 PATH 上有 dsh 就用那个，保证「这是哪个 dsh」只有一个答案。',
	'faq.q4': '会话记录和配置存在哪里？',
	'faq.a4':
		'与 CLI 全局共享，存储在 $DSH_HOME（默认 ~/.dsh）。你可以用环境变量 DSH_HOME 自定义目录，或用 DSH_BIN 指定 dsh 可执行文件的绝对路径。',
	'faq.q5': '支持自动更新吗？',
	'faq.a5':
		'支持。桌面端可自动检查并安装更新；Linux 环境下仅 AppImage 格式支持自更新。',
	'faq.q6': '为什么下载很慢？加速源安全吗？',
	'faq.a6':
		'安装包托管在 GitHub Releases，国内直连常常很慢。本站提供的加速源是社区维护的 GitHub 反向代理，只转发流量、不修改文件内容。若不放心，可以选择 GitHub 官方直连，或用 Release 页面提供的 .sig 签名文件校验安装包。',
	'faq.q7': '支持哪些系统？',
	'faq.a7':
		'Windows、macOS（通用二进制，支持 Apple Silicon 与 Intel）和 Linux。目前 Windows 与 Debian 系 Linux 已完成验证，macOS 暂未验证，欢迎反馈。建议使用 v0.1.3 及以后的版本。',

	// ── CTA / 页脚 ──
	'cta.heading': '现在开始',
	'cta.sub': '下载安装包，双击打开，剩下的它自己搞定。',
	'cta.button': '下载最新版',

	'foot.disclaimerTitle': '非官方声明',
	'foot.disclaimer':
		'本项目为基于 DeepSeek Harness 开发的第三方桌面客户端，与 DeepSeek 官方无隶属或合作关系。',
	'foot.product': '产品',
	'foot.resources': '资源',
	'foot.about': '关于',
	'foot.repo': '源码仓库',
	'foot.releases': '版本发布',
	'foot.issues': '反馈问题',
	'foot.upstream': 'DeepSeek Harness',
	'foot.license': 'MIT 许可证',
	'foot.readme': '使用文档',
	'foot.rights': '基于 MIT 许可证开源',
};

const en: Dict = {
	'site.title': 'dsh desktop — Desktop client for DeepSeek Harness',
	'site.desc':
		'dsh desktop is a cross-platform desktop client for DeepSeek Harness (dsh web). It launches the local service in the background and embeds it in a native window — no terminal, no port juggling. Windows, macOS and Linux.',

	'nav.features': 'Features',
	'nav.download': 'Download',
	'nav.plugins': 'Plugins',
	'nav.faq': 'FAQ',
	'nav.github': 'GitHub',
	'nav.menu': 'Open menu',
	'nav.lang': 'Switch language',

	'hero.badge': 'Built with Tauri v2 · Open source, MIT',
	'hero.title1': 'Put',
	'hero.titleCode': 'dsh web',
	'hero.title2': 'on your desktop',
	'hero.sub':
		'Launches the local dsh web service in the background on startup and embeds it in a native desktop window. No terminal, no port management — sessions and config are shared with the CLI.',
	'hero.cta': 'Download free',
	'hero.ctaSub': 'No sign-up required',
	'hero.cta2': 'View on GitHub',
	'hero.version': 'Latest version',
	'hero.platforms': 'Windows · macOS · Linux',
	'hero.free': 'Free and open source',

	'feat.heading': 'Why the desktop app',
	'feat.sub': 'The same dsh, minus the steps you repeat every day.',

	'feat.1.title': 'Works out of the box',
	'feat.1.body':
		'Detects and configures Node.js and the dsh runtime automatically, with no admin rights. On first launch it lists every Node it can find and lets you pick.',
	'feat.2.title': 'Coexists quietly',
	'feat.2.body':
		'Dynamic port allocation means it never collides with a dsh web you started by hand. Run both at once.',
	'feat.3.title': 'Lightweight and native',
	'feat.3.body':
		'A modern frameless UI that follows your system light/dark theme, with bilingual UI, native notifications and launch-at-login.',
	'feat.4.title': 'Shares your environment',
	'feat.4.body':
		'Uses the same dsh command as your global terminal and follows your PATH. Includes startup checks and one-click upgrades.',
	'feat.5.title': 'Visual plugin manager',
	'feat.5.body':
		'A built-in plugin panel installs and removes plugins in one click. A terminal entry point with the right env vars is there too — without polluting your system PATH.',
	'feat.6.title': 'Supervised and stable',
	'feat.6.body':
		'Single-instance process supervision reclaims every child process on exit. If dsh web dies unexpectedly, the app returns to the loading page and offers a restart.',

	'shot.heading': 'A look inside',
	'shot.sub': 'The full dsh web experience in a native window.',
	'shot.alt': 'Preview of the dsh desktop application interface',

	'dl.heading': 'Download dsh desktop',
	'dl.sub':
		'Pick your platform. Users in mainland China should prefer a mirror — it is usually much faster than GitHub.',
	'dl.detected': 'Detected platform',
	'dl.recommendedForYou': 'Recommended for you',
	'dl.otherPlatforms': 'Other platforms',
	'dl.source': 'Source',
	'dl.sourceHint': 'Change source',
	'dl.copy': 'Copy link',
	'dl.copied': 'Copied',
	'dl.copyFail': 'Copy failed — please copy manually',
	'dl.button': 'Download',
	'dl.size': 'Size',
	'dl.downloads': 'downloads',
	'dl.downloadsCadence': 'updated every 24h',
	'dl.downloadsNote': 'De-duplicated estimate across all download sources, aggregated every 24 hours. On GitHub:',
	'dl.checksum': 'Signatures & checksums',
	'dl.allAssets': 'All installers and release notes',
	'dl.mirrorTip':
		'Mirrors are community-run reverse proxies for GitHub traffic. This site does not host any installer. If one mirror fails, try another.',

	'os.windows': 'Windows',
	'os.macos': 'macOS',
	'os.linux': 'Linux',

	'status.verified': 'Verified',
	'status.untested': 'Not yet verified — feedback welcome',
	'status.partial': 'Verified on Debian-based',

	'dl.win.exe': 'Windows installer',
	'dl.win.exe.tab': '.exe',
	'dl.win.exe.note': '.exe · Requires WebView2 (auto-bootstrapped if missing)',
	'dl.mac.dmg': 'macOS disk image',
	'dl.mac.dmg.tab': '.dmg',
	'dl.mac.dmg.note': '.dmg · Universal binary for Apple Silicon and Intel',
	'dl.linux.appimage': 'Linux AppImage',
	'dl.linux.appimage.tab': 'AppImage',
	'dl.linux.appimage.note': '.AppImage · Recommended, full auto-update support',
	'dl.linux.deb': 'Linux Deb package',
	'dl.linux.deb.tab': '.deb',
	'dl.linux.deb.note': '.deb · For Debian / Ubuntu',
	'dl.pickFormat': 'Choose installer format',

	'mirror.ghproxy': 'Community mirror · fastest in China',
	'mirror.ghfast': 'Community mirror · alternate',
	'mirror.ghproxycom': 'Community mirror · alternate',
	'mirror.llkk': 'Community mirror · alternate',
	'mirror.direct': 'Official direct · may be slow in China',

	'tip.heading': 'Installation notes',
	'tip.win.title': 'Windows',
	'tip.win.body':
		'On first launch, if no local environment is found, the app fetches the dsh core components — keep your connection online. If WebView2 is missing, the installer will guide you through it.',
	'tip.win.ready': 'Ready to go — nothing to configure',
	'tip.mac.title': 'macOS blocks the first launch',
	'tip.mac.body':
		'Right-click the app in Finder and choose “Open”, or clear the quarantine flag from a terminal:',
	'tip.linux.title': 'Linux',
	'tip.linux.body':
		'AppImage is recommended for full self-update support. Make it executable after downloading:',
	'tip.cn.title': 'Slow npm downloads',
	'tip.cn.body':
		'The first launch pulls dsh components from npm. If that is slow, point npm at a faster registry:',

	'plug.heading': 'Plugins, without the command line',
	'plug.sub': 'Menu → Plugins… opens the visual panel.',
	'plug.1.title': 'One-click install',
	'plug.1.body':
		'Install from the curated list, or enter an npm package name or GitHub repo (e.g. github:owner/repo).',
	'plug.2.title': 'Native terminal',
	'plug.2.body':
		'Menu → Open Terminal launches a shell with the dsh environment already configured, leaving your global PATH untouched.',
	'plug.note':
		'Note: when installing a github: plugin, pnpm blocks build scripts by default for safety. If it errors, follow the panel’s hint to open the plugin directory and allow it under allowBuilds in $DSH_HOME/profiles/web/pnpm-workspace.yaml.',

	'faq.heading': 'Frequently asked questions',
	'faq.q1': 'Is dsh desktop an official DeepSeek product?',
	'faq.a1':
		'No. This is a third-party, open-source desktop client built on DeepSeek Harness. It has no affiliation with or endorsement from DeepSeek.',
	'faq.q2': 'Do I need Node.js and dsh installed first?',
	'faq.a2':
		'No. The app detects your environment: if a suitable Node and dsh already exist it uses them; otherwise it lists the Node installations it found and lets you choose, or downloads a fresh one (Node plus dsh, around 185 MB). No admin rights needed.',
	'faq.q3': 'Will it conflict with the dsh in my terminal?',
	'faq.a3':
		'No. It allocates a dynamic port, so it can run alongside a dsh web you started by hand. It also never rewrites your PATH — if your PATH has dsh, that is the one it uses, so “which dsh is this” has exactly one answer.',
	'faq.q4': 'Where are sessions and config stored?',
	'faq.a4':
		'Shared globally with the CLI under $DSH_HOME (default ~/.dsh). Override the directory with the DSH_HOME environment variable, or point DSH_BIN at a specific dsh executable.',
	'faq.q5': 'Does it auto-update?',
	'faq.a5':
		'Yes. The desktop app can check for and install updates automatically. On Linux, self-update is supported for the AppImage format only.',
	'faq.q6': 'Why is the download slow? Are the mirrors safe?',
	'faq.a6':
		'Installers are hosted on GitHub Releases, which is often slow from mainland China. The mirrors listed here are community-run GitHub reverse proxies that forward traffic without modifying files. If you would rather not use them, pick the official GitHub link, or verify your download against the .sig signature files on the release page.',
	'faq.q7': 'Which platforms are supported?',
	'faq.a7':
		'Windows, macOS (universal binary for Apple Silicon and Intel) and Linux. Windows and Debian-based Linux are verified; macOS is not yet verified and feedback is welcome. Use v0.1.3 or later.',

	'cta.heading': 'Get started',
	'cta.sub': 'Download the installer, double-click, and it handles the rest.',
	'cta.button': 'Download latest',

	'foot.disclaimerTitle': 'Unofficial project',
	'foot.disclaimer':
		'A third-party desktop client built on DeepSeek Harness, with no affiliation with or endorsement from DeepSeek.',
	'foot.product': 'Product',
	'foot.resources': 'Resources',
	'foot.about': 'About',
	'foot.repo': 'Source code',
	'foot.releases': 'Releases',
	'foot.issues': 'Report an issue',
	'foot.upstream': 'DeepSeek Harness',
	'foot.license': 'MIT License',
	'foot.readme': 'Documentation',
	'foot.rights': 'Open source under the MIT License',
};

const DICTS: Record<Lang, Dict> = { zh, en };

class I18nStore {
	/** 由根 layout 依据路由参数写入；预渲染阶段就必须是对的值。 */
	lang = $state<Lang>('zh');

	/** 取文案；缺失时回落到中文，再回落到 key 本身（方便发现漏翻） */
	t = (key: string): string => {
		return DICTS[this.lang][key] ?? zh[key] ?? key;
	};
}

export const i18n = new I18nStore();

/** 路由参数 → 语言。`[[lang=lang]]` 只可能是 undefined（中文）或 'en'。 */
export function langFromParam(param: string | undefined): Lang {
	return param === 'en' ? 'en' : 'zh';
}

/** 语言 → 该语言首页的路径。用于语言切换链接和 hreflang。 */
export function pathForLang(lang: Lang): string {
	return lang === 'en' ? '/en/' : '/';
}

/** <html lang> 用的 BCP 47 标签。 */
export function htmlLang(lang: Lang): string {
	return lang === 'en' ? 'en' : 'zh-CN';
}
