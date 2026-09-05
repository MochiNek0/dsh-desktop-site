<script lang="ts">
    import { i18n } from "$lib/i18n.svelte";
    import { detectOs } from "$lib/os";
    import {
        assetSize,
        downloadUrl,
        formatCount,
        formatSize,
        GITHUB_DOWNLOADS,
        LATEST_VERSION,
        MIRRORS,
        OS_GROUPS,
        REPO_URL,
        TOTAL_DOWNLOADS,
        type Mirror,
        type OsGroup,
        type OsId,
    } from "$lib/releases";
    import Icon from "./Icon.svelte";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    const t = $derived(i18n.t);

    /**
     * 切换动效要尊重「减少动态效果」。
     * app.css 里的 prefers-reduced-motion 只能压住 CSS transition/animation，
     * 管不到 Svelte 的 JS 过渡 —— 所以这里自己读一次媒体查询，
     * 命中时把 duration 归零（保留 DOM 进出逻辑，只是不动）。
     */
    let reduceMotion = $state(false);
    const swapMs = $derived(reduceMotion ? 0 : 260);

    // 下载源：默认第一个（国内推荐）。用户改过之后记住选择。
    const MIRROR_KEY = "dsh-site-mirror";
    let mirror = $state<Mirror>(MIRRORS[0]);
    let detected = $state<OsId | null>(null);
    let copied = $state<string | null>(null);
    let copyError = $state(false);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;

    $effect(() => {
        detected = detectOs();
        try {
            const saved = localStorage.getItem(MIRROR_KEY);
            const found = MIRRORS.find((m) => m.id === saved);
            if (found) mirror = found;
        } catch {
            // 忽略：隐私模式下 localStorage 不可用
        }

        // 偏好可能在会话中被改（系统设置里一开开关），所以监听而不是只读一次
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        reduceMotion = mq.matches;
        const onChange = (e: MediaQueryListEvent) => (reduceMotion = e.matches);
        mq.addEventListener("change", onChange);

        return () => {
            clearTimeout(copyTimer);
            mq.removeEventListener("change", onChange);
        };
    });

    function pickMirror(next: Mirror) {
        mirror = next;
        try {
            localStorage.setItem(MIRROR_KEY, next.id);
        } catch {
            // 忽略写入失败
        }
    }

    // 检测到的平台排在最前；未检测到则保持原顺序（Win / macOS / Linux）
    const ordered = $derived<OsGroup[]>(
        detected
            ? [
                  ...OS_GROUPS.filter((g) => g.id === detected),
                  ...OS_GROUPS.filter((g) => g.id !== detected),
              ]
            : OS_GROUPS,
    );

    const osIcon: Record<OsId, string> = {
        windows: "windows",
        macos: "apple",
        linux: "linux",
    };

    /**
     * 多安装包平台的 tab 选中项，按 OS 分别记住。
     * 默认值取该平台的 primary 包（没有标记则取第一个），
     * 所以 Linux 默认停在 AppImage 上。
     */
    let activeFile = $state<Partial<Record<OsId, string>>>({});

    function defaultFile(group: OsGroup): string {
        return (group.downloads.find((d) => d.primary) ?? group.downloads[0])
            .file;
    }

    function currentFile(group: OsGroup): string {
        const picked = activeFile[group.id];
        // 选中项必须仍存在于当前列表里，否则回退到默认包
        return picked && group.downloads.some((d) => d.file === picked)
            ? picked
            : defaultFile(group);
    }

    /**
     * 切换方向：新包在列表里比旧包靠后就从右侧滑入，靠前则从左侧。
     * 方向跟着 tab 的物理位置走，切换才有"横向翻页"的空间感，
     * 而不是所有切换都从同一侧冒出来。
     */
    let slideDir = $state(1);

    function pickFile(group: OsGroup, file: string) {
        const from = group.downloads.findIndex(
            (d) => d.file === currentFile(group),
        );
        const to = group.downloads.findIndex((d) => d.file === file);
        if (to === from) return;
        slideDir = to > from ? 1 : -1;
        activeFile = { ...activeFile, [group.id]: file };
    }

    /*
        格式 tab 的文字按自身宽度排（不强制等宽），所以黑色激活胶囊的
        位置/宽度必须实测当前选中按钮的几何，不能再按 1/N 估算。

        三个平台各有一根 tab，每根自己 rAF 的话，同一帧里就成了
        「读 → 写 → 读 → 写」：后面每次读几何都得先让浏览器把前面写进去的
        样式重新排一遍版，也就是强制同步重排。所以所有 rail 共用一次 rAF ——
        先把要量的全量完，再统一写回去，一帧里只失效一次布局。
    */
    const dirtyRails = new Set<HTMLElement>();
    let railFrame = 0;

    function flushRails() {
        railFrame = 0;
        const rails = [...dirtyRails];
        dirtyRails.clear();

        // 第一遍：只读
        const writes = rails.flatMap((rail) => {
            const pill = rail.querySelector<HTMLElement>("[data-pill]");
            const btn = Array.from(
                rail.querySelectorAll<HTMLButtonElement>(
                    "button[role='radio']",
                ),
            ).find((b) => b.getAttribute("aria-checked") === "true");
            if (!pill || !btn) return [];
            // 用 viewport 坐标差算精确位置：胶囊 absolute 定位，
            // 参照即当前 rail，所以 left = 按钮距 rail 左缘的像素差。
            const railRect = rail.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            return [
                {
                    pill,
                    left: btnRect.left - railRect.left,
                    width: btnRect.width,
                },
            ];
        });

        // 第二遍：只写
        for (const w of writes) {
            w.pill.style.left = `${w.left}px`;
            w.pill.style.width = `${w.width}px`;
        }
    }

    function queueRail(rail: HTMLElement) {
        dirtyRails.add(rail);
        // rAF 里量：这时 DOM 已经排好版，读几何不会再触发额外的重排
        railFrame ||= requestAnimationFrame(flushRails);
    }

    function measureTabs(node: HTMLElement, active: string) {
        queueRail(node);
        return {
            update(active: string) {
                queueRail(node);
            },
            destroy() {
                // 卸载后别再去量它：脱离文档的节点量出来全是 0
                dirtyRails.delete(node);
            },
        };
    }

    /**
     * 上报一次下载点击。
     *
     * 用 sendBeacon 而不是把按钮指向 /dl/ 再 302：下载链接必须直连镜像，
     * 不能因为统计端挂了就下不了。信标是 fire-and-forget，
     * 失败、被拦截、关了 JS 都只是少记一次。
     *
     * sid 是每次会话随机生成的，只为把「第一个镜像挂了、换下一个再点」
     * 收敛成一次下载 —— 汇总时按 (sid, file) 去重。关掉标签页就没了，
     * 不落 IP、不落 UA，也就没有跨会话追踪的能力。
     */
    const SID_KEY = "dsh-site-sid";
    function sessionId(): string | null {
        try {
            let sid = sessionStorage.getItem(SID_KEY);
            if (!sid) {
                const b = crypto.getRandomValues(new Uint8Array(8));
                sid = [...b].map((n) => n.toString(16).padStart(2, "0")).join("");
                sessionStorage.setItem(SID_KEY, sid);
            }
            return sid;
        } catch {
            // 隐私模式下 sessionStorage 不可用：放弃统计，不影响下载
            return null;
        }
    }

    /**
     * 这次会话的来源标记 —— 用来回答「哪个平台真的带来了下载」。
     *
     * 优先取 ?from=：发帖时手工给每个平台一个不同的值，这是唯一可靠的
     * 一手数据。取不到才退回 referrer 主机名 —— referrer 会被平台的
     * 跳转中转页和各种 referrer policy 抹掉，只能当补充，不能当依据。
     *
     * 必须存进 sessionStorage：?from= 只在落地那一刻存在，而用户往往
     * 是读完整页才点下载，那时地址栏可能已经没有它了。和 sid 同生命周期，
     * 同样不落 IP、不落 UA，关掉标签页就没了。
     *
     * 字符集必须和 worker/index.ts 的 SRC_RE 保持一致，否则这边发得出去、
     * 那边照样丢掉。
     */
    const SRC_KEY = "dsh-site-src";
    const SRC_RE = /^[a-z0-9._-]{1,32}$/;

    function detectSource(): string {
        const from = new URLSearchParams(location.search)
            .get("from")
            ?.toLowerCase();
        if (from && SRC_RE.test(from)) return from;
        try {
            const host = new URL(document.referrer).hostname
                .replace(/^www\./, "")
                .toLowerCase();
            // 站内跳转（比如中英切换）不是来源
            if (host !== location.hostname && SRC_RE.test(host)) return host;
        } catch {
            // referrer 为空或不是合法 URL —— 直接访问，没有来源可记
        }
        return "";
    }

    function clickSource(): string | null {
        try {
            let src = sessionStorage.getItem(SRC_KEY);
            if (src === null) {
                src = detectSource();
                sessionStorage.setItem(SRC_KEY, src);
            }
            // "" 表示「查过了，确实没来源」，别和「还没查」混为一谈
            return src || null;
        } catch {
            return null;
        }
    }

    function reportClick(file: string) {
        const sid = sessionId();
        if (!sid) return;
        try {
            navigator.sendBeacon?.(
                "/api/click",
                new Blob(
                    [
                        JSON.stringify({
                            sid,
                            file,
                            mirror: mirror.id,
                            src: clickSource(),
                        }),
                    ],
                    {
                        type: "application/json",
                    },
                ),
            );
        } catch {
            // 统计永远排在下载后面，这里什么都不做
        }
    }

    async function copyLink(file: string) {
        const url = downloadUrl(file, mirror);
        // 复制链接多半是拿去 wget，同样算一次下载意图；
        // 和点按钮共用 (sid, file) 去重键，两个都做也只记一次。
        reportClick(file);
        clearTimeout(copyTimer);
        copyError = false;
        try {
            await navigator.clipboard.writeText(url);
            copied = file;
        } catch {
            // clipboard 在非 HTTPS 或权限被拒时不可用
            copyError = true;
            copied = file;
        }
        copyTimer = setTimeout(() => {
            copied = null;
            copyError = false;
        }, 2200);
    }
</script>

<section
    id="download"
    class="section-x section-cool relative scroll-mt-20 overflow-hidden"
>
    <!--
        色相光斑：区块之间改用「冷暖」而不是「深浅」来区分。

        这里不能照抄 hero 的 -z-10 —— hero 自身没有底色，负层级压在 body 上正好；
        本区块有 section-tint 这层底色，-z-10 的光斑会被自己的底色盖掉。
        改成「光斑与内容都是定位元素」：同为 z-index:auto 时按 DOM 顺序绘制，
        光斑在前、内容在后，内容自然压在上面（所以下面那层要带 relative）。
    -->
    <div
        data-parallax="0.2"
        class="pointer-events-none absolute -top-24 -right-32 h-120 w-160 rounded-full bg-brand-300/40 blur-[80px]"
        aria-hidden="true"
    ></div>

    <!-- 点阵：治「平」，不引入新颜色。自带遮罩淡出，见 app.css -->
    <div
        class="layer-dots pointer-events-none absolute inset-0 text-brand-400/25"
        aria-hidden="true"
    ></div>

    <div class="relative container-page stack-section">
        <div class="stack-heading">
            {#key i18n.lang}
                <!-- 同首页标题：被 SplitText 拆过之后只能整块重建，见 +page.svelte 里的说明 -->
                <h2
                    data-split
                    class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                >
                    {t("dl.heading")}
                </h2>
            {/key}
            <p class="text-base/relaxed text-slate-600 sm:text-lg/relaxed">
                {t("dl.sub")}
            </p>
        </div>

        <!--
			── 版面结构 ────────────────────────────────────────────────
			之前这里是三层嵌套的盒子（下载源卡片 → 平台卡片 → 安装包面板），
			边框套边框、圆角套圆角，层级全靠描边堆出来，所以显得很"模板"。

			现在收成**一块**卡片：
			  · 下载源是一条贴在顶部的工具栏（无独立边框，只有一条下分隔线）
			  · 三个平台并排，用 divide-x 的细线分栏，不再各自成卡
			  · 安装包信息直接躺在栏里，没有内层盒子
			层级改由留白 + 底色 + 一条 hairline 表达，而不是三层描边。
		-->
        <!-- data-dl-card：入场只做位移不做透明度，下载按钮全程可点（motion.ts 约束 B） -->
        <div data-dl-card class="card elev-2 overflow-hidden">
            <!--
				下载源：不做一排灰色胶囊，而是收成一行"标签切换"。
				选中项用一条品牌色下划线跟手滑动，比滑块更轻，
				也不会和下面平台栏的横线打架。
			-->
            <div
                data-dl-bar
                class="flex flex-col gap-sm border-b border-line bg-paper-100/70 px-md py-sm sm:flex-row sm:items-center sm:gap-md sm:px-lg sm:py-md"
            >
                <span
                    class="flex shrink-0 items-center gap-xs text-sm font-semibold text-slate-900"
                >
                    <span
                        class="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand-50 to-accent-50 text-brand-600 ring-1 ring-brand-100"
                    >
                        <Icon name="bolt" size={14} />
                    </span>
                    {t("dl.source")}
                </span>

                <span
                    class="hidden h-5 w-px bg-line sm:block"
                    aria-hidden="true"
                ></span>

                <div
                    class="flex min-w-0 flex-1 flex-wrap items-center gap-x-sm gap-y-xs"
                    role="group"
                    aria-label={t("dl.source")}
                >
                    {#each MIRRORS as m, i (m.id)}
                        <button
                            type="button"
                            onclick={() => pickMirror(m)}
                            aria-pressed={mirror.id === m.id}
                            class="relative cursor-pointer pb-0.5 text-xs whitespace-nowrap transition-colors
							{mirror.id === m.id
                                ? 'font-semibold text-brand-700'
                                : 'text-slate-500 hover:text-slate-900'}"
                        >
                            {m.name}
                            {#if mirror.id === m.id}
                                <span
                                    aria-hidden="true"
                                    class="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-brand-500"
                                ></span>
                            {/if}
                        </button>
                    {/each}

                    {#key mirror.id}
                        <span
                            class="min-w-0 max-w-full truncate text-[11px] text-slate-400 sm:ml-auto sm:text-right"
                            in:fly={{
                                y: 4,
                                duration: swapMs,
                                easing: cubicOut,
                            }}
                        >
                            {t(mirror.noteKey)}
                        </span>
                    {/key}
                </div>
            </div>

            <!-- 三平台分栏 -->
            <div
                class="grid divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0"
            >
                {#each ordered as group (group.id)}
                    {@const isTop = detected === group.id}
                    {@const multi = group.downloads.length > 1}
                    {@const active = currentFile(group)}
                    <!--
						推荐栏用一道极淡的蓝紫→粉渐变标出来，比平铺底色更有"浮起"感。
						三类平台共用同一 icon 渐变芯片（与特性区一致），
						推荐项只是把标题/状态换成品牌色 —— 不再靠底色区分各自层级。
					-->
                    <div
                        class="flex flex-col gap-lg p-md sm:p-lg
						{isTop
                            ? 'bg-linear-to-b from-brand-50/70 via-transparent to-accent-50/40'
                            : ''}"
                    >
                        <!--
							头部一行：icon + 标题 + （tab | 徽标）。
							tab 和「为你推荐」都靠 ml-auto 推到行尾，二者互斥出现 ——
							同时挂两个会把窄栏挤爆，而"多包平台"本身就用不上徽标位。
						-->
                        <div class="flex items-center gap-sm">
                            <span
                                class="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-50 to-accent-50 text-brand-700 ring-1 ring-brand-100"
                            >
                                <Icon name={osIcon[group.id]} size={22} />
                            </span>
                            <div class="min-w-0">
                                <h3
                                    class="truncate text-sm font-semibold {isTop
                                        ? 'text-brand-800'
                                        : 'text-slate-900'}"
                                >
                                    {t(group.nameKey)}
                                </h3>
                                <p
                                    class="truncate text-[11px] {group.verified
                                        ? 'text-brand-600'
                                        : 'text-accent-600'}"
                                >
                                    {t(group.statusKey)}
                                </p>
                            </div>

                            {#if multi}
                                <!--
									分段控件同样用滑块：滑块宽度 = (100% - padding) / N，
									位移 = 选中下标 * 100%，所以增删安装包不用改样式。
								-->
                                <!--
									ml-auto min-w-0：允许这根 tab 在窄栏里收缩，
									不会把 AppImage 等长标签挤出卡片右缘。
								-->
                                <!--
									灰底盘 + 黑色激活胶囊：
									文字按自身宽度排（不强制等宽、不截断），
									标签再长也完整显示。容器与胶囊都 rounded-full。
									胶囊的滑块动画走 left/width，位置由 measureTabs 实测。
								-->
                                <div
                                    use:measureTabs={active}
                                    class="relative ml-auto flex min-w-0 max-w-full shrink rounded-full bg-paper-200 p-0.5"
                                    role="radiogroup"
                                    aria-label={t("dl.pickFormat")}
                                >
                                    <span
                                        data-pill
                                        aria-hidden="true"
                                        class="pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-ink-900 shadow-sm transition-[left,width] duration-300 ease-out-quint"
                                    ></span>
                                    {#each group.downloads as dl (dl.file)}
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={active === dl.file}
                                            onclick={() =>
                                                pickFile(group, dl.file)}
                                            class="relative z-10 min-h-7 shrink-0 cursor-pointer rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap transition-colors
											{active === dl.file ? 'text-white' : 'text-slate-600 hover:text-ink-900'}"
                                        >
                                            {t(dl.tabKey)}
                                        </button>
                                    {/each}
                                </div>
                            {:else if isTop}
                                <span
                                    class="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm"
                                >
                                    <Icon name="sparkle" size={10} />
                                    {t("dl.recommendedForYou")}
                                </span>
                            {/if}
                        </div>

                        <!--
							安装包信息不再套内层卡片，直接躺在栏里。
							grid + 单格：进出的两个面板叠在同一格上，
							所以切换时高度不会先塌再撑（那会让整行平台跳一下）。
						-->
                        <div class="grid flex-1 items-start">
                            {#each [group.downloads.find((d) => d.file === active)!] as dl (dl.file)}
                                <!-- {@const} 只能挂在块的直接子级上，所以放在 div 之前 -->
                                {@const bytes = assetSize(dl.file)}
                                <div
                                    class="col-start-1 row-start-1 flex h-full flex-col gap-md"
                                    in:fly={{
                                        x: slideDir * 16,
                                        duration: swapMs,
                                        easing: cubicOut,
                                    }}
                                >
                                    <div class="stack-tight">
                                        <div
                                            class="flex items-baseline justify-between gap-xs"
                                        >
                                            <span
                                                class="truncate text-sm font-medium text-slate-900"
                                                >{t(dl.labelKey)}</span
                                            >
                                            <!--
                                                体积来自构建期同步的精确字节数（见 releases.ts）。
                                                title 给出原始字节，页面上只显示约 3 位有效数字。
                                                取不到就整个不渲染 —— 宁可没有，也不写个约数糊弄。
                                            -->
                                            {#if bytes !== null}
                                                <span
                                                    class="nums-tabular shrink-0 font-mono text-[11px] text-slate-500"
                                                    title="{formatCount(bytes)} bytes"
                                                    >{formatSize(bytes)}</span
                                                >
                                            {/if}
                                        </div>
                                        <p
                                            class="text-[11px]/relaxed text-slate-500"
                                        >
                                            {t(dl.noteKey)}
                                        </p>
                                    </div>

                                    <!-- mt-auto：多包/单包栏的按钮排在同一基线上 -->
                                    <div class="mt-auto flex gap-xs">
                                        <a
                                            href={downloadUrl(dl.file, mirror)}
                                            onclick={() =>
                                                reportClick(dl.file)}
                                            class="flex min-h-11 flex-1 items-center justify-center gap-2xs rounded-xl px-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px
											{isTop
                                                ? 'bg-brand-600 shadow-sm shadow-brand-600/20 hover:bg-brand-700'
                                                : 'bg-ink-900 shadow-sm hover:bg-ink-800'}"
                                        >
                                            <Icon name="download" size={15} />
                                            {t("dl.button")}
                                        </a>
                                        <button
                                            type="button"
                                            onclick={() => copyLink(dl.file)}
                                            class="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-white text-slate-600 transition-colors hover:bg-paper-200 hover:text-slate-900"
                                            aria-label={t("dl.copy")}
                                            title={t("dl.copy")}
                                        >
                                            <Icon
                                                name={copied === dl.file &&
                                                !copyError
                                                    ? "check"
                                                    : "copy"}
                                                size={15}
                                            />
                                        </button>
                                    </div>

                                    {#if copied === dl.file}
                                        <p
                                            class="text-[11px] {copyError
                                                ? 'text-accent-600'
                                                : 'text-brand-600'}"
                                            role="status"
                                            in:fly={{
                                                y: -4,
                                                duration: swapMs,
                                                easing: cubicOut,
                                            }}
                                        >
                                            {copyError
                                                ? t("dl.copyFail")
                                                : t("dl.copied")}
                                        </p>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- 版本信息与全部资产 -->
        <div
            data-dl-meta
            class="flex flex-wrap items-center justify-between gap-sm text-sm text-slate-500"
        >
            <!-- 版本与下载量是同一类「元信息」，收成左侧一簇，右侧留给全部资产链接 -->
            <span class="flex flex-wrap items-center gap-x-sm gap-y-2xs">
                <span>
                    {t("hero.version")}
                    <a
                        href="{REPO_URL}/releases/tag/v{LATEST_VERSION}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="font-mono font-medium text-slate-700 hover:text-brand-700"
                        >v{LATEST_VERSION}</a
                    >
                </span>

                <!--
                    下载量：汇总不到时为 0，那就整条不出现 ——
                    显示一个「0 次下载」比不显示更糟。

                    这个数是 GitHub 侧 + 镜像侧去重后的**估算**，所以两件事必须写在脸上：
                    统计间隔挂在数字旁边（用户看到的可能是 24 小时前的值），
                    口径和可核对的 GitHub 分量放进 title。
                -->
                {#if TOTAL_DOWNLOADS > 0}
                    <span
                        class="hidden h-3.5 w-px bg-line sm:block"
                        aria-hidden="true"
                    ></span>
                    <span
                        class="nums-tabular"
                        title="{t('dl.downloadsNote')} {formatCount(
                            GITHUB_DOWNLOADS,
                        )}"
                    >
                        <span class="font-medium text-slate-700"
                            >{formatCount(TOTAL_DOWNLOADS)}</span
                        >
                        {t("dl.downloads")}
                        <span class="text-slate-400"
                            >· {t("dl.downloadsCadence")}</span
                        >
                    </span>
                {/if}
            </span>
            <a
                href="{REPO_URL}/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                class="group inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-brand-700"
            >
                {t("dl.allAssets")}
                <Icon
                    name="arrow"
                    size={14}
                    cls="transition-transform group-hover:translate-x-0.5"
                />
            </a>
        </div>
    </div>
</section>
