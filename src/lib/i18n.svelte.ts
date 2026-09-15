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

export type Lang = "zh" | "en";

export const LANGS: Lang[] = ["zh", "en"];

type Dict = Record<string, string>;

const zh: Dict = {
  // ── 站点/导航 ──
  "site.title": "dsh desktop — DeepSeek Harness 跨平台桌面客户端",
  "site.desc":
    "dsh desktop 是 DeepSeek Harness（dsh web）的极简跨平台桌面客户端。自动拉起本地服务并内嵌原生窗口，免开终端、免管端口；超轻量体积，一切皆插件，支持 DSH Market 与安全模式，与 CLI 完全共享配置。",

  "nav.features": "特性",
  "nav.download": "下载",
  "nav.plugins": "插件生态",
  "nav.faq": "常见问题",
  "nav.blog": "博客",
  "nav.github": "GitHub",
  "nav.menu": "打开菜单",
  "nav.lang": "切换语言",

  // ── Hero ──
  "hero.badge": "基于 Tauri v2 · 开源 MIT",
  "hero.title1": "把",
  "hero.titleCode": "dsh web",
  "hero.title2": "装进桌面",
  "hero.sub":
    "启动时自动在后台拉起本地 dsh web 并嵌入原生窗口。无需开终端、无需管理端口，会话、凭证与配置与 CLI 完全共享。",
  "hero.cta": "免费下载",
  "hero.ctaSub": "国内高速源 · 免登录",
  "hero.cta2": "在 GitHub 上查看",
  "hero.version": "最新版本",
  "hero.platforms": "Windows · macOS · Linux",
  "hero.free": "超轻量 2.3 MB 起",

  // ── 特性 ──
  "feat.heading": "为什么用桌面版",
  "feat.sub": "同一个 dsh，抹平终端琐碎，带来更轻、更稳、更纯粹的原生体验。",

  "feat.1.title": "极致轻量",
  "feat.1.body":
    "Tauri v2 + 系统 WebView，不打包浏览器内核。安装包 Windows 仅 2.3 MB，macOS 5.8 MB，Debian 3.8 MB，瞬时秒开极省资源。",
  "feat.2.title": "开箱即用，无感共存",
  "feat.2.body":
    "自动检测 Node、按需安装 dsh、自动选用空闲回环端口，与终端手动运行实例互不干扰；全程无需管理员权限。",
  "feat.3.title": "一切皆插件",
  "feat.3.body":
    "桌面端不改 dsh 一行源码。所有增强功能随包插件化供给，卸掉即回归纯净 dsh；首推 DSH Market 插件市场，安装卸载不碰终端。",
  "feat.4.title": "安全模式",
  "feat.4.body":
    "插件故障导致应用停在加载页？独创「不加载插件启动」脱困机制：一键剥离用户插件层进入面板排查卸载，菜单一键恢复。",
  "feat.5.title": "深度原生集成",
  "feat.5.body":
    "主题与语言跟随 dsh 设置无感切换；支持托盘常驻守护；AI 回合结束或等待审批时发送系统通知，更可在通知卡片上直接操作。",
  "feat.6.title": "环境与数据全共享",
  "feat.6.body":
    "会话、凭证与配置严格统一在 $DSH_HOME（默认 ~/.dsh），与命令行完全共享；单实例守护，退出时自动回收全部子进程。",

  // ── 截图 ──
  "shot.heading": "界面预览",
  "shot.sub": "原生窗口里的完整 dsh web 体验。",
  "shot.alt": "dsh desktop 应用界面预览",

  // ── 下载 ──
  "dl.heading": "下载 dsh desktop",
  "dl.sub":
    "选择你的系统。国内用户建议使用加速源，速度通常远快于 GitHub 直连。",
  "dl.detected": "检测到你的系统",
  "dl.recommendedForYou": "为你推荐",
  "dl.otherPlatforms": "其他平台",
  "dl.source": "下载源",
  "dl.sourceHint": "换一个源",
  "dl.autoBadge": "自动优选",
  "dl.autoPicking": "正在为你测速，挑选最快的下载源…",
  "dl.autoPicked": "已自动选择最快的源：{name}（{ms} ms）",
  "dl.autoNone": "所有源探测都超时了，暂时用默认源，你可以手动换一个试试",
  "dl.switchedTo": "已切换到 {name}",
  "dl.reAuto": "重新自动选择",
  "dl.reAutoTitle": "重新测速并自动切换到当前最快的下载源",
  "dl.latencyMs": "{ms} ms",
  "dl.latencyTesting": "测速中…",
  "dl.latencyTimeout": "超时",
  "dl.latencyFail": "不可用",
  "dl.copy": "复制链接",
  "dl.copied": "已复制",
  "dl.copyFail": "复制失败，请手动复制",
  "dl.button": "下载",
  "dl.size": "体积",
  // 与 formatCount 拼成「364 次 GitHub 下载」——
  // 口径写死在文案里：这是 GitHub 侧计数，不是安装量
  "dl.downloads": "次下载（全部版本）",
  "dl.downloadsCadence": "每 24 小时更新",
  "dl.downloadsNote":
    "所有正式版本、所有下载源的累计估算，已去重。每 24 小时汇总一次。其中 GitHub 侧",
  "dl.checksum": "校验与签名文件",
  "dl.allAssets": "查看全部安装包与更新日志",

  // 与 formatCount 拼成「本站总共访问人数 3,289」。
  // 口径是**人数**：按浏览器里的一个随机标识去重，
  // 同一个人来多少次都只算一个，所以这个数远小于常见的「浏览量」。
  "visitors.label": "本站总共访问人数",
  // 中文把标签放数字前面（「本站总共访问人数 3,289」），
  // 英文相反（「3,289 visitors so far」）—— 硬套同一个语序总有一边别扭
  "visitors.order": "label-first",
  "visitors.note":
    "按访客去重，同一个人多次访问只算一次。仅在你的浏览器中存一个随机标识，不记录 IP、不记录 UA，清除站点数据即重置。",
  "dl.mirrorTip":
    "加速源由第三方社区提供，仅代理 GitHub 流量，本站不托管安装包。若某个源失效，请换一个再试。",

  "os.windows": "Windows",
  "os.macos": "macOS",
  "os.linux": "Linux",

  "status.verified": "已验证",
  "status.untested": "暂未验证，欢迎反馈",
  "status.partial": "Debian 系已验证",

  "dl.win.exe": "Windows 安装包",
  "dl.win.exe.tab": ".exe",
  "dl.win.exe.note": ".exe · 需 WebView2，缺失时自动引导安装（已验证）",
  "dl.mac.dmg": "macOS 磁盘映像",
  "dl.mac.dmg.tab": ".dmg",
  "dl.mac.dmg.note": ".dmg · 通用二进制，支持 Apple Silicon 与 Intel",
  "dl.linux.appimage": "Linux AppImage",
  "dl.linux.appimage.tab": "AppImage",
  "dl.linux.appimage.note": ".AppImage · 推荐，内置 WebKit，支持完整自动更新",
  "dl.linux.deb": "Linux Deb 包",
  "dl.linux.deb.tab": ".deb",
  "dl.linux.deb.note": ".deb · 轻量 3.8 MB，适用于 Debian / Ubuntu",
  "dl.pickFormat": "选择安装包格式",

  "mirror.ghproxy": "社区加速 · 国内推荐",
  "mirror.ghfast": "社区加速 · 备用",
  "mirror.ghproxycom": "社区加速 · 备用",
  "mirror.ghproxyorg": "社区加速 · 备用（gh-proxy 新域名）",
  "mirror.llkk": "社区加速 · 备用",
  "mirror.direct": "官方直连 · 国内可能较慢",

  // ── 安装提示 ──
  "tip.heading": "安装指引与日常须知",
  "tip.win.title": "Windows",
  "tip.win.body":
    "安装包为 .exe（NSIS）。需 WebView2，缺失时会自动引导安装（已验证）。首次启动缺失环境时需联网拉取核心组件。",
  "tip.win.ready": "即开即用 —— 无需手动配置",
  "tip.mac.title": "macOS 首次运行被拦截",
  "tip.mac.body":
    "通用二进制支持 Apple Silicon 与 Intel。在访达中右键点击应用选择「打开」，或在终端执行以下命令解除隔离：",
  "tip.linux.title": "Linux 运行与自更新",
  "tip.linux.body":
    "推荐 AppImage 以获得完整自更新支持（Debian 系已验证）。下载后赋予可执行权限即可运行：",
  "tip.cn.title": "国内网络加速建议",
  "tip.cn.body":
    "应用首次启动需要从 npm 拉取 dsh 组件。若下载缓慢，可先为 npm 配置国内镜像：",
  // 命令块上的复制按钮：这里复制的是命令，不是下载链接，
  // 所以不复用 dl.copy（那条是「复制链接」）
  "tip.copy": "复制命令",
  "tip.copyFail": "复制失败",

  "tip.note.runtime.title": "自动运行环境",
  "tip.note.runtime.desc":
    "若机器上未找到可用的 Node，应用会自动弹出「运行环境」面板，一键装好 Node 24。",
  "tip.note.tray.title": "关闭即收进托盘",
  "tip.note.tray.desc":
    "点按窗口关闭按钮仅收进托盘常驻，长线任务不中断；彻底退出请使用菜单里的「退出 dsh」。",
  "tip.note.update.title": "静默检查更新",
  "tip.note.update.desc":
    "启动时在后台静默检查，有更新才提示，下载前先征求同意，安心无打扰。",

  // ── 插件 ──
  "plug.heading": "一切皆插件，不用碰命令行",
  "plug.sub":
    "桌面端不改 dsh 一行源码。内置可视化管理面板并首推 DSH Market 插件市场。",
  "plug.market.badge": "官方推荐生态",
  "plug.market.title": "DSH Market 插件市场",
  "plug.market.desc":
    "dsh 里的可视化插件市场，浏览、搜索并一键安装社区精选插件（dshmarket.com）。",
  "plug.market.cta": "访问 DSH Market",
  "plug.1.title": "可视化一键管理",
  "plug.1.body":
    "从预设列表或 DSH Market 直接安装，也支持手动输入 npm 包名或 GitHub 仓库地址（如 github:owner/repo）。",
  "plug.2.title": "安全模式",
  "plug.2.body":
    "插件若引发崩溃，加载页提供「不加载插件启动」脱困启动，把用户插件暂摘出层列表，直接唤起面板卸载故障项。",
  "plug.3.title": "独立环境变量终端",
  "plug.3.body":
    "菜单 → 打开终端，启动一个已配好 dsh 环境变量的独立终端，安全调试且绝不污染系统全局 PATH。",
  "plug.note.title": "安装 github: 插件安全提示",
  "plug.note":
    "提示：安装 github: 形式的插件时，pnpm 出于安全考虑默认会拦截构建脚本。如遇报错，请按面板提示在配置文件中放行该插件：",

  // ── FAQ ──
  "faq.heading": "常见问题",
  "faq.q1": "dsh desktop 是 DeepSeek 官方产品吗？",
  "faq.a1":
    "不是。本项目是基于 DeepSeek Harness 开发的第三方开源桌面客户端，与 DeepSeek 官方没有隶属或合作关系，代码在 GitHub 完全开源。",
  "faq.q2": "需要先安装 Node.js 和 dsh 吗？",
  "faq.a2":
    "不需要。应用会自动检测环境：如果机器上已有合适的 Node 和 dsh 就直接用；如果没有，应用会自动弹出「运行环境」面板，支持一键安装 Node 24 与 dsh。全程不需要管理员权限。",
  "faq.q3": "为什么安装包体积这么小（仅 2.3 MB 起）？",
  "faq.a3":
    "基于 Tauri v2 构建，直接调用操作系统自带的原生 WebView 内核（Windows WebView2 / macOS WebKit / Linux WebKitGTK），不打包上百兆的 Chromium 浏览器内核，内存与磁盘占用大幅缩减。",
  "faq.q4": "遇到插件崩溃导致应用打不开怎么办？",
  "faq.a4":
    "独创「安全模式」：插件在 dsh web 端口绑定前加载，若遇崩溃停在加载页，加载页会直接提供「不加载插件启动」按钮，一键把用户插件暂摘出层列表启动，直接打开面板卸掉出问题的插件，之后在菜单点「重新加载插件」原样装回。",
  "faq.q5": "会和我终端里的 dsh 冲突吗？",
  "faq.a5":
    "完全不会。应用采用动态空闲端口分配，可以和终端里手动运行的 dsh web 同时开着。它也不会改写系统的全局 PATH，保证环境干净独立。",
  "faq.q6": "会话记录和配置存在哪里？支持哪些环境变量？",
  "faq.a6":
    "与 CLI 全局共享，严格保存在 $DSH_HOME（默认 ~/.dsh）。支持 DSH_BIN 指定 dsh 可执行文件的绝对路径（优先级最高且跳过 Node 版本检查），支持 DSH_HOME 自定义数据与配置目录。",
  "faq.q7": "支持自动更新吗？",
  "faq.a7":
    "支持。桌面端启动时静默检查更新，有新版才提示，下载前征求同意。Linux 环境下推荐 AppImage 格式以获得最完整的自动更新支持。",
  "faq.q8": "支持哪些系统平台？",
  "faq.a8":
    "Windows（.exe）、macOS（.dmg 通用二进制，支持 Apple Silicon 与 Intel）和 Linux（.deb 与 .AppImage）。目前 Windows 与 Debian 系 Linux 已完成验证，macOS 欢迎体验与反馈。",

  // ── CTA / 页脚 ──
  "cta.heading": "现在开始",
  "cta.sub": "下载安装包，双击打开，剩下的它自己搞定。",
  "cta.button": "下载最新版",

  "foot.disclaimerTitle": "非官方声明",
  "foot.disclaimer":
    "本项目为基于 DeepSeek Harness 开发的第三方桌面客户端，与 DeepSeek 官方无隶属或合作关系。",
  "foot.product": "产品",
  "foot.resources": "资源",
  "foot.about": "关于",
  "foot.repo": "源码仓库",
  "foot.releases": "版本发布",
  "foot.issues": "反馈问题",
  "foot.upstream": "DeepSeek Harness",
  "foot.market": "DSH Market 插件市场",
  "foot.license": "MIT 许可证",
  "foot.readme": "使用文档",
  "foot.rights": "基于 MIT 许可证开源",
};

const en: Dict = {
  "site.title":
    "dsh desktop — Cross-platform desktop client for DeepSeek Harness",
  "site.desc":
    "dsh desktop is an ultra-lightweight, cross-platform desktop client for DeepSeek Harness (dsh web). Embeds local services into a native window with zero terminal setup, full plugin ecosystem, Safe Mode, and shared CLI config.",

  "nav.features": "Features",
  "nav.download": "Download",
  "nav.plugins": "Plugins",
  "nav.faq": "FAQ",
  "nav.github": "GitHub",
  "nav.menu": "Open menu",
  "nav.lang": "Switch language",

  "hero.badge": "Built with Tauri v2 · Open source, MIT",
  "hero.title1": "Put",
  "hero.titleCode": "dsh web",
  "hero.title2": "on your desktop",
  "hero.sub":
    "Launches the local dsh web service in the background on startup and embeds it in a native desktop window. No terminal, no port management — sessions and config are shared with the CLI.",
  "hero.cta": "Download free",
  "hero.ctaSub": "Fast mirrors · No login",
  "hero.cta2": "View on GitHub",
  "hero.version": "Latest version",
  "hero.platforms": "Windows · macOS · Linux",
  "hero.free": "Ultra-light from 2.3 MB",

  "feat.heading": "Why dsh desktop",
  "feat.sub":
    "The same dsh, minus the daily friction — light, stable, and truly native.",

  "feat.1.title": "Ultra-lightweight",
  "feat.1.body":
    "Tauri v2 on the system WebView with no bundled browser engine. Installers are 2.3 MB on Windows, 5.8 MB on macOS, and 3.8 MB on Debian.",
  "feat.2.title": "Works out of the box",
  "feat.2.body":
    "Auto-detects Node, installs dsh on demand, and picks free loopback ports without collision. Zero admin rights required at any point.",
  "feat.3.title": "Everything is a plugin",
  "feat.3.body":
    "Not a single line of dsh source code is modified. Desktop capabilities run as plugins; features the built-in DSH Market marketplace without terminal steps.",
  "feat.4.title": "Safe Mode recovery",
  "feat.4.body":
    "Crashing plugin blocks startup? Start without plugins temporarily bypasses faulty layers to launch cleanly, uninstall the culprit, and reload smoothly.",
  "feat.5.title": "Native integration",
  "feat.5.body":
    "Syncs theme and language without reload; tray supervision keeps tasks alive; interactive notifications take allow/refuse actions directly.",
  "feat.6.title": "Unified environment & data",
  "feat.6.body":
    "Sessions, credentials, and settings strictly live in $DSH_HOME (~/.dsh). Single-instance supervision cleanly reclaims all child processes on exit.",

  "shot.heading": "A look inside",
  "shot.sub": "The full dsh web experience in a native window.",
  "shot.alt": "Preview of the dsh desktop application interface",

  "dl.heading": "Download dsh desktop",
  "dl.sub":
    "Pick your platform. Users in mainland China should prefer a mirror — it is usually much faster than GitHub.",
  "dl.detected": "Detected platform",
  "dl.recommendedForYou": "Recommended for you",
  "dl.otherPlatforms": "Other platforms",
  "dl.source": "Source",
  "dl.sourceHint": "Change source",
  "dl.autoBadge": "Auto-optimized",
  "dl.autoPicking": "Testing mirrors to find the fastest one for you…",
  "dl.autoPicked": "Auto-selected the fastest source: {name} ({ms} ms)",
  "dl.autoNone":
    "All sources timed out — staying on the default for now, feel free to switch manually",
  "dl.switchedTo": "Switched to {name}",
  "dl.reAuto": "Auto-pick again",
  "dl.reAutoTitle":
    "Re-test all sources and switch to whichever is fastest right now",
  "dl.latencyMs": "{ms} ms",
  "dl.latencyTesting": "testing…",
  "dl.latencyTimeout": "timed out",
  "dl.latencyFail": "unavailable",
  "dl.copy": "Copy link",
  "dl.copied": "Copied",
  "dl.copyFail": "Copy failed — please copy manually",
  "dl.button": "Download",
  "dl.size": "Size",
  "dl.downloads": "downloads (all versions)",
  "dl.downloadsCadence": "updated every 24h",
  "dl.downloadsNote":
    "De-duplicated estimate across every release and every download source, aggregated every 24 hours. On GitHub:",
  "dl.checksum": "Signatures & checksums",
  "dl.allAssets": "All installers and release notes",

  "visitors.label": "visitors so far",
  "visitors.order": "count-first",
  "visitors.note":
    "Unique visitors — coming back later does not count again. A random id is kept in your browser only; no IP, no user agent. Clearing site data resets it.",
  "dl.mirrorTip":
    "Mirrors are community-run reverse proxies for GitHub traffic. This site does not host any installer. If one mirror fails, try another.",

  "os.windows": "Windows",
  "os.macos": "macOS",
  "os.linux": "Linux",

  "status.verified": "Verified",
  "status.untested": "Not yet verified — feedback welcome",
  "status.partial": "Verified on Debian-based",

  "dl.win.exe": "Windows installer",
  "dl.win.exe.tab": ".exe",
  "dl.win.exe.note":
    ".exe · Requires WebView2 (auto-bootstrapped if missing, verified)",
  "dl.mac.dmg": "macOS disk image",
  "dl.mac.dmg.tab": ".dmg",
  "dl.mac.dmg.note": ".dmg · Universal binary for Apple Silicon and Intel",
  "dl.linux.appimage": "Linux AppImage",
  "dl.linux.appimage.tab": "AppImage",
  "dl.linux.appimage.note":
    ".AppImage · Recommended, bundled WebKit, full auto-update support",
  "dl.linux.deb": "Linux Deb package",
  "dl.linux.deb.tab": ".deb",
  "dl.linux.deb.note": ".deb · Lightweight 3.8 MB, for Debian / Ubuntu",
  "dl.pickFormat": "Choose installer format",

  "mirror.ghproxy": "Community mirror · fastest in China",
  "mirror.ghfast": "Community mirror · alternate",
  "mirror.ghproxycom": "Community mirror · alternate",
  "mirror.ghproxyorg": "Community mirror · alternate (new gh-proxy domain)",
  "mirror.llkk": "Community mirror · alternate",
  "mirror.direct": "Official direct · may be slow in China",

  "tip.heading": "Installation & runtime notes",
  "tip.win.title": "Windows",
  "tip.win.body":
    ".exe installer (NSIS). Requires WebView2; downloaded automatically if missing (verified). On first run, it fetches core components if needed.",
  "tip.win.ready": "Ready to go — nothing to configure",
  "tip.mac.title": "macOS blocks the first launch",
  "tip.mac.body":
    "Universal binary for Apple Silicon and Intel. Right-click the app in Finder and choose “Open”, or clear the quarantine flag from a terminal:",
  "tip.linux.title": "Linux execution & updates",
  "tip.linux.body":
    "AppImage is recommended for full self-update support (verified on Debian). Make it executable after downloading:",
  "tip.cn.title": "Slow npm downloads in China",
  "tip.cn.body":
    "The first launch pulls dsh components from npm. If that is slow, point npm at a faster domestic registry:",
  "tip.copy": "Copy",
  "tip.copyFail": "Failed",

  "tip.note.runtime.title": "Runtime auto-detection",
  "tip.note.runtime.desc":
    "If no usable Node is found, the Runtime panel opens by itself and installs Node 24 in one click.",
  "tip.note.tray.title": "Minimize to tray",
  "tip.note.tray.desc":
    'Closing the window parks in the tray so in-flight tasks stay alive. Use "Quit dsh" in the menu to exit.',
  "tip.note.update.title": "Silent auto-updates",
  "tip.note.update.desc":
    "Checked silently on launch, raised only when there is one, and downloaded only with your consent.",

  "plug.heading": "Plugins, without the command line",
  "plug.sub":
    "Not a single line of dsh code modified. Built-in visual panel and featured DSH Market.",
  "plug.market.badge": "Featured Ecosystem",
  "plug.market.title": "DSH Market Marketplace",
  "plug.market.desc":
    "The visual plugin marketplace inside dsh — browse, search, and install community plugins in one click (dshmarket.com).",
  "plug.market.cta": "Visit DSH Market",
  "plug.1.title": "One-click visual install",
  "plug.1.body":
    "Install directly from curated presets or DSH Market, or enter an npm package name or GitHub repo (e.g. github:owner/repo).",
  "plug.2.title": "Safe Mode (recover from crashes)",
  "plug.2.body":
    "If a crashing plugin blocks startup, Start without plugins temporarily unmounts user plugins so you can uninstall the culprit safely.",
  "plug.3.title": "Isolated env terminal",
  "plug.3.body":
    "Menu → Open Terminal launches a shell with dsh env vars already configured, leaving your global PATH untouched.",
  "plug.note.title": "GitHub plugin build security",
  "plug.note":
    "Note: pnpm blocks build scripts from git sources by default. If it errors, allow the package under allowBuilds in the workspace file:",

  "faq.heading": "Frequently asked questions",
  "faq.q1": "Is dsh desktop an official DeepSeek product?",
  "faq.a1":
    "No. This is a third-party, open-source desktop client built on DeepSeek Harness. It has no affiliation with DeepSeek, and its source is fully open on GitHub.",
  "faq.q2": "Do I need Node.js and dsh installed first?",
  "faq.a2":
    "No. The app detects your environment: if a suitable Node and dsh exist it uses them; otherwise the Runtime panel pops up to install Node 24 and dsh in one click, without admin rights.",
  "faq.q3": "Why are the installers so small (from 2.3 MB)?",
  "faq.a3":
    "Built on Tauri v2 using the operating system’s native WebView engine (WebView2 on Windows, WebKit on macOS/Linux) instead of bundling a 100+ MB Chromium runtime, dramatically reducing memory and disk footprint.",
  "faq.q4": "What if a broken plugin crashes the app on launch?",
  "faq.a4":
    'The app features Safe Mode: plugins load before dsh web binds its port. If one crashes, the loading page offers "Start without plugins" to temporarily isolate user plugins, launch cleanly, and let you uninstall the culprit from the panel.',
  "faq.q5": "Will it conflict with the dsh in my terminal?",
  "faq.a5":
    "Not at all. It allocates dynamic loopback ports, so it can run alongside manual CLI instances without collision. It also never rewrites your global PATH.",
  "faq.q6":
    "Where are sessions and config stored? What env vars are supported?",
  "faq.a6":
    "Data is shared globally with the CLI under $DSH_HOME (default ~/.dsh). Supported env vars: DSH_BIN specifies the absolute dsh executable path and skips version checks; DSH_HOME specifies the root data and config directory.",
  "faq.q7": "Does it auto-update?",
  "faq.a7":
    "Yes. The app checks silently on launch, alerts you only when an update exists, and asks for consent before downloading. On Linux, AppImage format provides full self-update support.",
  "faq.q8": "Which platforms are supported?",
  "faq.a8":
    "Windows (.exe), macOS (.dmg universal binary for Apple Silicon and Intel), and Linux (.deb and .AppImage). Windows and Debian Linux are verified; macOS is ready for testing and feedback.",

  "cta.heading": "Get started",
  "cta.sub": "Download the installer, double-click, and it handles the rest.",
  "cta.button": "Download latest",

  "foot.disclaimerTitle": "Unofficial project",
  "foot.disclaimer":
    "A third-party desktop client built on DeepSeek Harness, with no affiliation with or endorsement from DeepSeek.",
  "foot.product": "Product",
  "foot.resources": "Resources",
  "foot.about": "About",
  "foot.repo": "Source code",
  "foot.releases": "Releases",
  "foot.issues": "Report an issue",
  "foot.upstream": "DeepSeek Harness",
  "foot.market": "DSH Market",
  "foot.license": "MIT License",
  "foot.readme": "Documentation",
  "foot.rights": "Open source under the MIT License",
};

const DICTS: Record<Lang, Dict> = { zh, en };

class I18nStore {
  /** 由根 layout 依据路由参数写入；预渲染阶段就必须是对的值。 */
  lang = $state<Lang>("zh");

  /**
   * 取文案；缺失时回落到中文，再回落到 key 本身（方便发现漏翻）。
   *
   * `vars` 是可选的占位符替换表：文案里的 `{foo}` 会被 `vars.foo` 替换。
   * 只有少数几条文案（如自动选源提示里的源名/延迟）需要插值，
   * 所以不引入模板库，就地做字符串替换。
   */
  t = (key: string, vars?: Record<string, string | number>): string => {
    const raw = DICTS[this.lang][key] ?? zh[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) =>
      name in vars ? String(vars[name]) : m,
    );
  };
}

export const i18n = new I18nStore();

/** 路由参数 → 语言。`[[lang=lang]]` 只可能是 undefined（中文）或 'en'。 */
export function langFromParam(param: string | undefined): Lang {
  return param === "en" ? "en" : "zh";
}

/** 语言 → 该语言首页的路径。用于语言切换链接和 hreflang。 */
export function pathForLang(lang: Lang): string {
  return lang === "en" ? "/en/" : "/";
}

/** <html lang> 用的 BCP 47 标签。 */
export function htmlLang(lang: Lang): string {
  return lang === "en" ? "en" : "zh-CN";
}
