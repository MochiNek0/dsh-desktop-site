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
  "site.title": "dsh desktop — DeepSeek Harness 桌面客户端，手机也能远程用",
  "site.desc":
    "dsh desktop 是 DeepSeek Harness（dsh web）的第三方开源桌面客户端，安装包仅几 MB。手机扫码即可远程使用电脑上的 dsh（局域网 / Tailscale / Cloudflare）；免开终端、免管端口，与 CLI 共享会话和配置，支持插件与安全模式。",

  "nav.download": "下载",
  "nav.connect": "手机连接",
  "nav.docs": "文档",
  "nav.github": "GitHub",
  "nav.menu": "打开菜单",
  "nav.lang": "切换语言",

  // ── Hero ──
  // {version} 由构建期同步的测试版号填入（见 sync-release.mjs）
  "hero.preview": "{version} 测试版已发布 · 抢先体验",
  "hero.released": "v{version} 已发布 · 查看更新内容",
  "hero.title1": "把",
  "hero.titleCode": "dsh web",
  "hero.title2": "装进桌面",
  "hero.sub":
    "启动时自动在后台拉起本地 dsh web 并嵌入原生窗口。无需开终端、无需管理端口，会话、凭证与配置与 CLI 完全共享。",
  "hero.cta": "免费下载",
  "hero.cta2": "在 GitHub 上查看",
  "hero.alsoOfficialPrompt": "也在寻找官方版本？",
  "hero.alsoOfficialLink": "体验 DeepSeek Harness 官方桌面端",
  "hero.version": "最新版本",
  "hero.stat.downloads": "累计下载",
  "hero.stat.visitors": "访问人数",
  "hero.stat.size": "最小安装包",

  // ── 特性 ──
  "feat.heading": "为什么用桌面版",
  "feat.sub": "还是同一个 dsh，只是不用再开终端、记端口。",

  "feat.1.title": "安装包只有几 MB",
  // {win} / {mac} / {deb} 由 releases.ts 的 SIZE_VARS 在构建期填入真实体积，
  // 和首屏统计卡同源，发版不用再手改。FAQ 标题里的「2.5 MB 起」仍是手填的。
  "feat.1.body":
    "Tauri v2 + 系统 WebView，不打包浏览器内核。安装包 Windows 仅 {win}，macOS {mac}，Debian {deb}。",
  "feat.2.title": "开箱即用，与终端共存",
  "feat.2.body":
    "自动检测 Node、按需安装 dsh、自动选用空闲回环端口，与终端手动运行实例互不干扰；全程无需管理员权限。",
  "feat.3.title": "一切皆插件",
  "feat.3.body":
    "桌面端不改 dsh 一行源码。桌面增强功能（如系统通知）以随包插件提供，卸掉即回到原版 dsh；内置插件面板，可从 DSH Market 安装，不用开终端。",
  "feat.4.title": "安全模式",
  "feat.4.body":
    "插件崩溃导致应用停在加载页时，加载页提供「不加载插件启动」：暂时不加载你装的插件，直接打开面板卸掉出问题的那个，之后在菜单里「重新加载插件」原样装回。",
  "feat.5.title": "托盘、通知与主题",
  "feat.5.body":
    "主题与界面语言跟随 dsh 设置，切换无需重启；支持托盘常驻和开机自启；回合结束或 dsh 等待确认时发系统通知，允许 / 拒绝可直接在通知上点。",
  "feat.6.title": "与命令行共享数据",
  "feat.6.body":
    "会话、凭证与配置都在 $DSH_HOME（默认 ~/.dsh），和命令行里的 dsh 是同一份；只允许运行一个实例，退出时回收全部子进程。",

  // ── 截图 ──
  "shot.heading": "界面预览",
  "shot.sub": "原生窗口里的完整 dsh web 体验。",
  "shot.alt": "dsh desktop 应用界面预览",

  // ── 手机连接 ──
  "phone.badge": "测试版",
  "phone.badgeNew": "新功能",
  "phone.heading": "离开电脑，也能接着用",
  "phone.sub":
    "扫一下桌面端卡片上的二维码，手机就进入同一个 dsh 会话。每次接入都要电脑上点头，配对活过桌面重启。",
  "phone.lan": "局域网",
  "phone.lanBody": "同一个 Wi-Fi 下直连，最快。",
  "phone.ts": "Tailscale",
  "phone.tsBody": "在外面也能进，WireGuard 加密。",
  "phone.cf": "Cloudflare 隧道",
  "phone.cfBody": "任何网络可达，带 TLS；空闲 30 分钟自动关闭。",
  "phone.cta": "打开连接门户",
  "phone.docs": "使用说明",

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
  "dl.groupPrompt": "遇到安装或使用问题？欢迎加入用户交流群探讨",
  "dl.installHelp": "安装指引",
  "dl.official.badge": "官方版本",
  "dl.official.title": "你也可以体验 DeepSeek Harness 官方桌面端",
  "dl.official.desc":
    "DeepSeek 现已正式推出官方桌面客户端。如需原厂桌面体验，欢迎前往官网下载。",
  "dl.official.cta": "前往官方下载",

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
  "dl.linux.deb.note": ".deb · 轻量 {deb}，适用于 Debian / Ubuntu",
  "dl.pickFormat": "选择安装包格式",

  "mirror.ghproxy": "社区加速 · 国内推荐",
  "mirror.ghfast": "社区加速 · 备用",
  "mirror.ghproxycom": "社区加速 · 备用",
  "mirror.ghproxyorg": "社区加速 · 备用（gh-proxy 新域名）",
  "mirror.llkk": "社区加速 · 备用",
  "mirror.direct": "官方直连 · 国内可能较慢",

  // ── 插件 ──
  "plug.heading": "一切皆插件，不用碰命令行",
  "plug.sub":
    "桌面端不改 dsh 一行源码。内置可视化管理面板并首推 DSH Market 插件市场。",
  "plug.market.badge": "推荐生态",
  "plug.market.title": "DSH Market 插件市场",
  "plug.market.desc":
    "dsh 里的可视化插件市场，浏览、搜索并一键安装社区精选插件（dshmarket.com）。",
  "plug.market.cta": "访问 DSH Market",
  "plug.1.title": "可视化一键管理",
  "plug.1.body":
    "从预设列表或 DSH Market 直接安装，也支持手动输入 npm 包名或 GitHub 仓库地址（如 github:owner/repo）。",
  "plug.2.title": "安全模式",
  "plug.2.body":
    "插件若引发崩溃，加载页提供「不加载插件启动」：把你装的插件暂时摘出层列表，直接打开面板卸载出问题的那个。",
  "plug.3.title": "独立环境变量终端",
  "plug.3.body":
    "菜单 → 打开终端，启动一个已配好 dsh 环境变量的终端，不改动系统全局 PATH。",

  // ── CTA / 页脚 ──
  "cta.heading": "现在开始",
  "cta.sub": "下载安装包，双击打开，剩下的它自己搞定。",
  "cta.button": "下载最新版",
  "cta.alsoOfficialPrompt": "寻找官方版本？",
  "cta.alsoOfficialLink": "体验 DeepSeek Harness 官方桌面端",

  // ── 文档 ──
  "docs.title": "文档",
  "docs.desc": "安装、手机连接、插件与常见问题。",
  "docs.copy": "复制",
  "docs.copied": "已复制",
  "docs.copyFail": "复制失败",
  "docs.prev": "上一篇",
  "docs.next": "下一篇",

  // ── 连接门户 /go/ ──
  // 这一页不是给访客看的，是给已经装了 app 的人用的，所以文案一律假定
  // 读者面前就有一台开着 dsh desktop 的电脑，不再从头解释这个产品是什么。
  "go.title": "连接我的电脑 · dsh desktop",
  "go.desc":
    "扫一下 dsh desktop 上的二维码，之后从这一页直接进入自己的 dsh。机器清单只存在你自己的浏览器里。",

  "go.heading": "连接我的电脑",
  "go.sub": "扫一下电脑上「手机连接」卡片里的二维码。之后每次从这一页点进去就行，不用再扫。",

  "go.soon.title": "目前在测试版中",
  "go.soon.body":
    "手机连接随桌面端测试版提供，正式版暂未包含。这一页可以先添加到主屏幕，等正式版发布后直接用。",

  "go.empty.title": "还没有添加任何电脑",
  "go.empty.body":
    "在电脑上打开 dsh desktop，点标题栏的「手机连接」，然后扫一下卡片上的二维码。",

  "go.scan": "扫描二维码",
  "go.type": "手动输入地址",
  "go.add": "添加一台电脑",

  "go.scan.hint": "把电脑上的二维码放进框里",
  "go.scan.cancel": "取消",
  "go.scan.failed": "打不开相机",
  "go.scan.failedHint":
    "可能是没给授权，也可能这台设备没有可用的摄像头。关掉这里改用「手动输入地址」—— 卡片上的地址和二维码是同一个。",

  "go.type.title": "手动输入地址",
  "go.type.label": "电脑卡片上显示的地址",
  "go.type.submit": "下一步",
  "go.type.cancel": "取消",

  "go.confirm.title": "确认这个地址",
  "go.confirm.warn":
    "下一步会离开本站，跳到下面这台主机。请确认它确实是你自己的电脑 —— 二维码是谁都能印的。",
  "go.confirm.name": "给这台电脑起个名字",
  "go.confirm.defaultName": "我的电脑",
  "go.confirm.into": "归到哪台电脑",
  "go.confirm.intoNew": "新建一台",
  "go.confirm.go": "连接",
  "go.confirm.cancel": "返回",
  "go.confirm.waiting": "正在等电脑上点同意",
  "go.confirm.waitBody":
    "电脑上会弹出一个窗口，问要不要放这台手机进来。去点同意，这一页会自己跳过去。别再点一次「连接」——二维码只能用一次，再点会让手机收到一句「已经失效」，而电脑上那个窗口还开着。",

  "go.kind.lan": "局域网",
  "go.kind.lanHint": "手机和电脑在同一个 Wi-Fi 下",
  "go.kind.tailscale": "Tailscale",
  "go.kind.tailscaleHint": "两边登录了同一个 tailnet",
  "go.kind.public": "公网",
  "go.kind.publicHint": "任何网络下都能进",
  "go.kind.unknown": "未知",
  "go.kind.unknownHint": "判断不出这是哪条通道",

  "go.err.empty": "还没有填地址。",
  "go.err.shape": "这看起来不是一个地址。",
  "go.err.scheme": "只接受 http:// 和 https:// 开头的地址。",
  "go.err.userinfo": "地址里带了用户名或密码。那是把人骗过去的经典写法，这里一律不收。",
  "go.err.path": "地址后面还跟着路径或锚点。卡片上那个地址到端口为止。",
  "go.err.query": "地址后面跟着不认识的参数。配对链接只应该带一个 pair_token。",
  "go.err.loopback":
    "这是电脑自己的地址（127.0.0.1 / localhost），在手机上只会指向手机自己。卡片上那条 localhost 是给 Cloudflare 控制台填的，不是给手机用的。",

  "go.remove": "删除这台",
  "go.remove.title": "删除「{name}」？",
  "go.remove.body":
    "这台电脑会从这一页的清单里消失。电脑上已经配对的设备不受影响，重新扫一次就能加回来。",
  "go.remove.ok": "删除",
  "go.remove.cancel": "返回",
  "go.removeChannel": "删除这个地址",

  "go.notes": "使用前，几件要知道的事",
  "go.install.heading": "把这一页添加到主屏幕",
  "go.install.body":
    "这一页的地址永远不变，所以从主屏幕点进来永远打得开 —— 哪怕电脑关着、换了 IP、或者切了通道。直接把二维码里那个地址加到主屏幕做不到这一点：地址一变，图标点开就是一片白。",
  "go.install.ios": "iOS：Safari 分享菜单 → 添加到主屏幕。",
  "go.install.android": "Android：Chrome 菜单 → 添加到主屏幕。",

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
  "foot.officialDesktop": "官方桌面端",
  "foot.market": "DSH Market 插件市场",
  "foot.license": "{license} 许可证",
  "foot.readme": "GitHub README",
  "foot.rights": "基于 {license} 许可证开源",
  "foot.group": "QQ 交流群",
  "foot.groupCopied": "已复制群号",
  "foot.clickCopy": "点击复制群号",
};

const en: Dict = {
  "site.title":
    "dsh desktop — DeepSeek Harness desktop client with phone access",
  "site.desc":
    "dsh desktop is an unofficial, open-source desktop client for DeepSeek Harness (dsh web) with a few-MB installer. Scan a QR code to use your computer's dsh from your phone over LAN, Tailscale or Cloudflare. No terminal or port setup; shares sessions and config with the CLI.",

  "nav.download": "Download",
  "nav.connect": "Phone connection",
  "nav.docs": "Docs",
  "nav.github": "GitHub",
  "nav.menu": "Open menu",
  "nav.lang": "Switch language",

  "hero.title1": "Put",
  "hero.titleCode": "dsh web",
  "hero.title2": "on your desktop",
  "hero.sub":
    "Launches the local dsh web service in the background on startup and embeds it in a native desktop window. No terminal, no port management — sessions and config are shared with the CLI.",
  "hero.cta": "Download free",
  "hero.cta2": "View on GitHub",
  "hero.alsoOfficialPrompt": "Looking for the official app?",
  "hero.alsoOfficialLink": "Try DeepSeek Harness Official Desktop",
  "hero.version": "Latest version",
  "hero.preview": "{version} pre-release is out · Try it early",
  "hero.released": "v{version} is out · What’s new",
  "hero.stat.downloads": "Downloads",
  "hero.stat.visitors": "Visitors",
  "hero.stat.size": "Smallest installer",

  "feat.heading": "Why dsh desktop",
  "feat.sub":
    "The same dsh, without opening a terminal or keeping track of ports.",

  "feat.1.title": "A few-MB installer",
  "feat.1.body":
    "Tauri v2 on the system WebView with no bundled browser engine. Installers are {win} on Windows, {mac} on macOS, and {deb} on Debian.",
  "feat.2.title": "Works out of the box, next to the CLI",
  "feat.2.body":
    "Detects Node, installs dsh on demand, and picks a free loopback port, so it runs alongside a dsh you started in a terminal. No admin rights needed.",
  "feat.3.title": "Everything is a plugin",
  "feat.3.body":
    "dsh source is not modified. Desktop features (such as system notifications) ship as bundled plugins; remove them and you have plain dsh. A built-in plugin panel installs from DSH Market without a terminal.",
  "feat.4.title": "Safe Mode",
  "feat.4.body":
    "If a plugin crash leaves the app on the loading page, it offers Start without plugins: your plugins are set aside, the panel opens so you can remove the broken one, and Reload plugins puts the rest back.",
  "feat.5.title": "Tray, notifications and theme",
  "feat.5.body":
    "Theme and UI language follow your dsh settings without a restart. Runs in the tray and can start at login. Sends a system notification when a turn ends or dsh asks for approval; allow / deny right on the notification.",
  "feat.6.title": "Shares data with the CLI",
  "feat.6.body":
    "Sessions, credentials and settings live in $DSH_HOME (default ~/.dsh), the same ones the dsh CLI uses. Only one instance runs at a time, and all child processes are cleaned up on exit.",

  "shot.heading": "A look inside",
  "shot.sub": "The full dsh web experience in a native window.",
  "shot.alt": "Preview of the dsh desktop application interface",

  "phone.badge": "Pre-release",
  "phone.badgeNew": "New",
  "phone.heading": "Step away, keep going",
  "phone.sub":
    "Scan the QR code on the desktop card and your phone joins the same dsh session. Every new device needs a yes on the computer, and pairing survives desktop restarts.",
  "phone.lan": "Local network",
  "phone.lanBody": "Direct on the same Wi-Fi — the fastest.",
  "phone.ts": "Tailscale",
  "phone.tsBody": "Reach it while out, encrypted by WireGuard.",
  "phone.cf": "Cloudflare tunnel",
  "phone.cfBody": "Any network, with TLS; closes itself after 30 idle minutes.",
  "phone.cta": "Open the portal",
  "phone.docs": "How it works",

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
  "dl.groupPrompt": "Need help with setup or usage? Join our user community group",
  "dl.installHelp": "Installation guide",
  "dl.official.badge": "Official Release",
  "dl.official.title": "Also try the official DeepSeek Harness desktop app",
  "dl.official.desc":
    "DeepSeek has officially launched its desktop client. If you prefer the official edition, you can download it directly from the official website.",
  "dl.official.cta": "Get Official Desktop",

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
  "dl.linux.deb.note": ".deb · Lightweight {deb}, for Debian / Ubuntu",
  "dl.pickFormat": "Choose installer format",

  "mirror.ghproxy": "Community mirror · fastest in China",
  "mirror.ghfast": "Community mirror · alternate",
  "mirror.ghproxycom": "Community mirror · alternate",
  "mirror.ghproxyorg": "Community mirror · alternate (new gh-proxy domain)",
  "mirror.llkk": "Community mirror · alternate",
  "mirror.direct": "Official direct · may be slow in China",

  "plug.heading": "Plugins, without the command line",
  "plug.sub":
    "Not a single line of dsh code modified. Built-in visual panel and featured DSH Market.",
  "plug.market.badge": "Recommended",
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

  "cta.heading": "Get started",
  "cta.sub": "Download the installer, double-click, and it handles the rest.",
  "cta.button": "Download latest",
  "cta.alsoOfficialPrompt": "Looking for the official release?",
  "cta.alsoOfficialLink": "Try DeepSeek Harness Official Desktop",

  "docs.title": "Docs",
  "docs.desc": "Installation, phone connection, plugins, and FAQ.",
  "docs.copy": "Copy",
  "docs.copied": "Copied",
  "docs.copyFail": "Failed",
  "docs.prev": "Previous",
  "docs.next": "Next",

  "go.title": "Connect to my computer · dsh desktop",
  "go.desc":
    "Scan the QR code on dsh desktop once, then reach your own dsh from this page. The list of machines lives in your browser only.",

  "go.heading": "Connect to my computer",
  "go.sub":
    "Scan the QR code on the “Phone connection” card on your computer. After that, just open this page and tap — no more scanning.",

  "go.soon.title": "In pre-release for now",
  "go.soon.body":
    "Phone connection ships in the desktop pre-release builds and is not in the stable release yet. You can add this page to your home screen now and use it once the stable release lands.",

  "go.empty.title": "No computers added yet",
  "go.empty.body":
    "Open dsh desktop on your computer, click “Phone connection” in the title bar, and scan the QR code on the card.",

  "go.scan": "Scan QR code",
  "go.type": "Enter address",
  "go.add": "Add a computer",

  "go.scan.hint": "Line the QR code up inside the frame",
  "go.scan.cancel": "Cancel",
  "go.scan.failed": "Cannot open the camera",
  "go.scan.failedHint":
    "Permission may have been denied, or this device has no usable camera. Close this and use “Enter address” instead — the card shows the same address the QR code carries.",

  "go.type.title": "Enter address",
  "go.type.label": "The address shown on the card",
  "go.type.submit": "Next",
  "go.type.cancel": "Cancel",

  "go.confirm.title": "Check this address",
  "go.confirm.warn":
    "The next tap leaves this site for the host below. Make sure it really is your own computer — anyone can print a QR code.",
  "go.confirm.name": "Name this computer",
  "go.confirm.defaultName": "My computer",
  "go.confirm.into": "Add to",
  "go.confirm.intoNew": "A new computer",
  "go.confirm.go": "Connect",
  "go.confirm.cancel": "Back",
  "go.confirm.waiting": "Waiting for the computer to say yes",
  "go.confirm.waitBody":
    "A window has opened on the computer asking whether to let this phone in. Say yes there and this page goes through on its own. Do not press Connect again — the QR code works once, and a second press gets this phone a “no longer valid” while that window is still open on the computer.",

  "go.kind.lan": "Local network",
  "go.kind.lanHint": "Phone and computer on the same Wi-Fi",
  "go.kind.tailscale": "Tailscale",
  "go.kind.tailscaleHint": "Both signed in to the same tailnet",
  "go.kind.public": "Public",
  "go.kind.publicHint": "Reachable from any network",
  "go.kind.unknown": "Unknown",
  "go.kind.unknownHint": "Cannot tell which channel this is",

  "go.err.empty": "No address yet.",
  "go.err.shape": "That does not look like an address.",
  "go.err.scheme": "Only http:// and https:// addresses are accepted.",
  "go.err.userinfo":
    "The address carries a username or password. That is a classic way to disguise where a link goes, so it is refused here.",
  "go.err.path": "The address has a path or anchor after it. The one on the card ends at the port.",
  "go.err.query":
    "The address carries a parameter we do not recognise. A pairing link should only ever have pair_token.",
  "go.err.loopback":
    "That is the computer’s own address (127.0.0.1 / localhost) — on a phone it points at the phone. The localhost line on the card is for the Cloudflare dashboard, not for your phone.",

  "go.remove": "Remove",
  "go.remove.title": "Remove “{name}”?",
  "go.remove.body":
    "This computer disappears from the list on this page. Devices already paired on the computer are unaffected — scan again to add it back.",
  "go.remove.ok": "Remove",
  "go.remove.cancel": "Cancel",
  "go.removeChannel": "Remove this address",

  "go.notes": "A few things worth knowing first",
  "go.install.heading": "Add this page to your home screen",
  "go.install.body":
    "This page’s address never changes, so the icon always opens — even when the computer is off, its IP changed, or you switched channels. Putting the QR code’s address on the home screen cannot do that: the moment it changes, the icon opens onto a blank page.",
  "go.install.ios": "iOS: Safari share menu → Add to Home Screen.",
  "go.install.android": "Android: Chrome menu → Add to Home screen.",

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
  "foot.officialDesktop": "Official Desktop",
  "foot.market": "DSH Market",
  "foot.license": "{license} License",
  "foot.readme": "README",
  "foot.rights": "Open source under the {license} License",
  "foot.group": "QQ Group",
  "foot.groupCopied": "Copied",
  "foot.clickCopy": "Click to copy group number",
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
