<script lang="ts">
    import { i18n, pathForLang } from "$lib/i18n.svelte";
    import { detectOs } from "$lib/os";
    import {
        assetSize,
        downloadUrl,
        formatCount,
        formatSize,
        GITHUB_DOWNLOADS,
        LATEST_VERSION,
        MIRRORS,
        OFFICIAL_DESKTOP_URL,
        OS_GROUPS,
        REPO_URL,
        SIZE_VARS,
        TOTAL_DOWNLOADS,
        type Download,
        type Mirror,
        type OsGroup,
        type OsId,
    } from "$lib/releases";
    import { clickSource, sessionId } from "$lib/session";
    import {
        pickBest,
        raceMirrors,
        raceMirrorsCached,
        type ProbeResult,
    } from "$lib/mirror-race";
    import Icon from "./Icon.svelte";
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
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

    // 下载源：默认第一个（国内推荐），随后尽量用自动测速选出的最优源覆盖。
    // 用户手动选过之后记住选择，且不再被自动测速静默覆盖。
    const MIRROR_KEY = "dsh-site-mirror";
    const MIRROR_LOCK_KEY = "dsh-site-mirror-locked";
    let mirror = $state<Mirror>(MIRRORS[0]);
    let detected = $state<OsId | null>(null);
    let copied = $state<string | null>(null);
    let copyError = $state(false);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;

    /**
     * 自动选优状态机：
     *   idle    → 还没跑过测速
     *   racing  → 正在测速（每个源的小圆点转圈）
     *   done    → 测速完成，probeResults 里有每个源的延迟/可用性
     * userLocked 为 true 时，测速仍然跑（用于展示各源状态），
     * 但结果不会自动切换当前选中的 mirror —— 尊重用户的手动选择。
     */
    let raceState = $state<"idle" | "racing" | "done">("idle");
    let probeResults = $state<ProbeResult[]>([]);
    let userLocked = $state(false);

    /**
     * 切换提示条：每次「自动选中」或「手动切换」都写一条，
     * 短暂展示后自动消失 —— 这是本次改造里让切换意图变得显眼的核心。
     */
    let notice = $state<{ kind: "auto" | "manual" | "none"; text: string } | null>(
        null,
    );
    let noticeTimer: ReturnType<typeof setTimeout> | undefined;

    /** 切换按钮的短暂高亮脉冲：记录刚刚变化的 mirror id，配合 CSS 动画自行消退 */
    let pulseId = $state<string | null>(null);
    let pulseTimer: ReturnType<typeof setTimeout> | undefined;

    function showNotice(kind: "auto" | "manual" | "none", text: string) {
        clearTimeout(noticeTimer);
        notice = { kind, text };
        noticeTimer = setTimeout(() => {
            notice = null;
        }, 3600);
    }

    function firePulse(id: string) {
        clearTimeout(pulseTimer);
        pulseId = id;
        pulseTimer = setTimeout(() => {
            pulseId = null;
        }, 620);
    }

    function probeFor(id: string): ProbeResult | undefined {
        return probeResults.find((r) => r.id === id);
    }

    async function runAutoRace(opts: { force?: boolean } = {}) {
        if (raceState === "racing") return;
        raceState = "racing";
        if (!userLocked || opts.force) {
            showNotice("auto", t("dl.autoPicking"));
        }
        // 强制重测（用户主动点了「重新自动选择」）时绕开短期缓存
        const results = opts.force
            ? await raceMirrors()
            : await raceMirrorsCached();
        probeResults = results;
        raceState = "done";

        if (userLocked && !opts.force) return;

        const bestId = pickBest(results);
        if (!bestId) {
            if (!userLocked) showNotice("none", t("dl.autoNone"));
            return;
        }
        const best = MIRRORS.find((m) => m.id === bestId);
        const bestResult = results.find((r) => r.id === bestId);
        if (!best) return;

        userLocked = false;
        try {
            localStorage.removeItem(MIRROR_LOCK_KEY);
        } catch {
            // 忽略
        }

        if (mirror.id !== best.id) {
            mirror = best;
            firePulse(best.id);
        }
        showNotice(
            "auto",
            t("dl.autoPicked", {
                name: best.name,
                ms: bestResult?.ms ?? "?",
            }),
        );
    }

    /*
        这段是**一次性的挂载逻辑**，必须用 onMount 而不是 $effect。

        $effect 会追踪同步执行期间读到的每一个 $state —— 而 runAutoRace 的
        同步段就读了 raceState / userLocked，然后立刻写回它们。
        effect 写自己的依赖 = 自我失效 = 无限重跑，Svelte 抛
        effect_update_depth_exceeded，整个客户端 bootstrap 当场挂掉。

        onMount 不建立任何依赖追踪，读写自由，且语义上也更准确：
        探测系统、读 localStorage、起一次测速，都只该发生一次。
    */
    onMount(() => {
        detected = detectOs();
        try {
            userLocked = localStorage.getItem(MIRROR_LOCK_KEY) === "1";
            const saved = localStorage.getItem(MIRROR_KEY);
            const found = MIRRORS.find((m) => m.id === saved);
            if (found) mirror = found;
        } catch {
            // 忽略：隐私模式下 localStorage 不可用
        }

        // 无论用户是否锁定过手动选择，都跑一次测速 ——
        // 锁定时只用于展示各源的实时状态点，不会挪动当前选中项（见 runAutoRace）。
        void runAutoRace();

        // 偏好可能在会话中被改（系统设置里一开开关），所以监听而不是只读一次
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        reduceMotion = mq.matches;
        const onChange = (e: MediaQueryListEvent) => (reduceMotion = e.matches);
        mq.addEventListener("change", onChange);

        return () => {
            clearTimeout(copyTimer);
            clearTimeout(noticeTimer);
            clearTimeout(pulseTimer);
            mq.removeEventListener("change", onChange);
        };
    });

    function pickMirror(next: Mirror) {
        const changed = next.id !== mirror.id;
        mirror = next;
        userLocked = true;
        try {
            localStorage.setItem(MIRROR_KEY, next.id);
            localStorage.setItem(MIRROR_LOCK_KEY, "1");
        } catch {
            // 忽略写入失败
        }
        if (changed) {
            firePulse(next.id);
            showNotice("manual", t("dl.switchedTo", { name: next.name }));
        }
    }

    /** 「重新自动选择」：解除手动锁定，强制重新测速并切到当前最快源。 */
    function reAutoPick() {
        userLocked = false;
        try {
            localStorage.removeItem(MIRROR_LOCK_KEY);
        } catch {
            // 忽略
        }
        void runAutoRace({ force: true });
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

    /**
     * 主面板 / 侧栏拆分：ordered[0]（检测到的平台，未检测到时是
     * Windows）占据左侧大面板，其余平台收进右侧窄列 —— 版面理由
     * 见模板里「版面结构」的说明。
     */
    const primary = $derived<OsGroup>(ordered[0]);
    const rest = $derived<OsGroup[]>(ordered.slice(1));

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

        所有平台共用一次 rAF —— 先把要量的全量完，再统一写回去，
        一帧里只失效一次布局，避免「读 → 写 → 读 → 写」的强制同步重排。
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
     * sid / clickSource 来自 $lib/session，和访客计数共用同一次会话 ——
     * 定义和取舍都写在那个模块里。
     */
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

    let copiedGroup = $state(false);
    let groupCopyTimer: ReturnType<typeof setTimeout> | undefined;

    async function copyGroup() {
        try {
            await navigator.clipboard.writeText("1125671315");
            copiedGroup = true;
            clearTimeout(groupCopyTimer);
            groupCopyTimer = setTimeout(() => {
                copiedGroup = false;
            }, 2200);
        } catch {
            // fallback
        }
    }
</script>

<!-- ══ 复用片段：主面板与侧栏共用，只有字号 / 按钮档位不同 ══ -->

<!--
    格式 tab（多安装包平台用）。compact：侧栏头部里的小号；
    主面板里的大一号。胶囊位置由 measureTabs 实测，见 script。
-->
{#snippet tabRail(group: OsGroup, active: string, compact: boolean)}
    <div
        use:measureTabs={active}
        class="relative flex w-fit min-w-0 max-w-full shrink rounded-full bg-paper-200 p-0.5 {compact
            ? 'ml-auto'
            : ''}"
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
                onclick={() => pickFile(group, dl.file)}
                class="relative z-10 shrink-0 rounded-full font-semibold whitespace-nowrap transition-colors
				{compact ? 'min-h-7 px-2.5 text-[11px]' : 'min-h-9 px-3.5 text-xs'}
				{active === dl.file
                    ? 'text-white'
                    : 'text-slate-600 hover:text-ink-900'}"
            >
                {t(dl.tabKey)}
            </button>
        {/each}
    </div>
{/snippet}

<!--
    下载按钮 + 复制链接。主面板：实底品牌色大按钮；侧栏：描边按钮。
    原版三个平台各挂一个同重量的深色按钮，谁也不是主角 ——
    次要平台的行动点退后一层，主 CTA 才立得起来。
-->
{#snippet actions(dl: Download, compact: boolean)}
    <div class="mt-auto flex gap-xs">
        <a
            href={downloadUrl(dl.file, mirror)}
            onclick={() => reportClick(dl.file)}
            class="flex flex-1 items-center justify-center rounded-full font-semibold transition-colors
			{compact
                ? 'min-h-10 gap-2xs border border-line bg-white px-3 text-[13px] text-slate-800 hover:border-line-strong hover:bg-paper-100'
                : 'min-h-12 gap-xs bg-ink-900 px-5 text-[15px] text-white hover:bg-ink-800'}"
        >
            <Icon name="download" size={compact ? 14 : 18} />
            {t("dl.button")}
        </a>
        <button
            type="button"
            onclick={() => copyLink(dl.file)}
            class="grid shrink-0 place-items-center rounded-full border transition-colors
			{compact ? 'size-10' : 'size-12'}
			{copied === dl.file && !copyError
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-line bg-white text-slate-600 hover:bg-paper-200 hover:text-slate-900'}"
            aria-label={copied === dl.file
                ? copyError
                    ? t("dl.copyFail")
                    : t("dl.copied")
                : t("dl.copy")}
            title={copied === dl.file
                ? copyError
                    ? t("dl.copyFail")
                    : t("dl.copied")
                : t("dl.copy")}
        >
            <Icon
                name={copied === dl.file && !copyError ? "check" : "copy"}
                size={compact ? 14 : 16}
            />
        </button>
    </div>
    <!--
        复制反馈看按钮对勾（同 InstallTips）。可见文字会让面板在点击时
        顶高，多包切换时高度跳动更明显；sr-only 不占布局，
        live region 要一直在 DOM 里才会被播报。
    -->
    <p class="sr-only" role="status">
        {copied === dl.file
            ? copyError
                ? t("dl.copyFail")
                : t("dl.copied")
            : ""}
    </p>
{/snippet}

<!--
    当前选中安装包的信息区（切 tab 时整块翻页）。
    grid + 单格：进出的两个面板叠在同一格上，所以切换时高度
    不会先塌再撑。滑入方向见 pickFile。
-->
{#snippet pkgZone(group: OsGroup, compact: boolean)}
    {@const active = currentFile(group)}
    <div class="grid flex-1 items-start">
        {#each [group.downloads.find((d) => d.file === active)!] as dl (dl.file)}
            {@const bytes = assetSize(dl.file)}
            <div
                class="col-start-1 row-start-1 flex h-full flex-col {compact
                    ? 'gap-md'
                    : 'gap-xl'}"
                in:fly={{
                    x: slideDir * 16,
                    duration: swapMs,
                    easing: cubicOut,
                }}
            >
                {#if compact}
                    <div class="stack-tight">
                        <div
                            class="flex items-baseline justify-between gap-xs"
                        >
                            <span
                                class="truncate text-[13px] font-medium text-slate-900"
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
                        <p class="text-[11px]/relaxed text-slate-500">
                            {t(dl.noteKey, SIZE_VARS)}
                        </p>
                    </div>

                    <!-- mt-auto：侧栏卡片被 grid 拉平时按钮贴底 -->
                    {@render actions(dl, true)}
                {:else}
                    <div class="stack-tight">
                        <span
                            class="text-lg font-semibold text-slate-900"
                            >{t(dl.labelKey)}</span
                        >
                        <p class="max-w-[28rem] text-sm/relaxed text-slate-600">
                            {t(dl.noteKey, SIZE_VARS)}
                        </p>
                    </div>

                    <!--
                        底部「下载目标」块：文件名 + 体积 + 按钮收成一组，
                        贴住面板底缘。中段的留白因此是刻意的呼吸位，而不
                        是空洞；体积也从标题旁挪下来，和文件名凑成一对
                        mono 规格 —— 按钮按下去拿到的是什么，这里最清楚。
                    -->
                    <div class="mt-auto flex flex-col gap-sm">
                        <div
                            class="flex items-baseline justify-between gap-sm"
                        >
                            <span
                                class="nums-tabular truncate font-mono text-[11px] text-slate-500"
                                title={dl.file}
                                >{dl.file}</span
                            >
                            {#if bytes !== null}
                                <span
                                    class="nums-tabular shrink-0 font-mono text-[11px] font-medium text-slate-600"
                                    title="{formatCount(bytes)} bytes"
                                    >{formatSize(bytes)}</span
                                >
                            {/if}
                        </div>
                        {@render actions(dl, false)}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
{/snippet}

<section id="download" class="section-x scroll-mt-20">
    <div class="container-page stack-section">
        <div data-reveal class="stack-heading">
            <h2 class="heading-2">{t("dl.heading")}</h2>
            <p class="lede">{t("dl.sub")}</p>
        </div>

        <!--
            ── 版面结构 ────────────────────────────────────────────────
            主面板（检测到的平台，约 3/5 宽）+ 侧栏（其余两个平台）+ 底部下载源条，
            各自是一座独立的「岛」，彼此用留白而不是 hairline 隔开 ——
            和下面官方桌面端 / 交流群那两张小卡是同一套语言。

            2026-10 改版：原来这块堆了渐变底、渐变图标芯片、实心蓝按钮、
            三四种徽标，配色和全站（黑白 + 一点品牌蓝）脱节，显得旧。
            现在只靠层级说话：
              · 主按钮和首屏 / 顶栏一样用 ink-900 实底胶囊，全站只有一种主 CTA 长相
              · 平台图标统一用中性芯片，「为你推荐」降成一枚浅色小标
              · 下载源从卡片顶部挪到底部：它是「出了问题才会去碰」的设置，
                不该是用户进到这一屏读到的第一行
        -->
        <!-- 下载卡片不参与入场动画：这是下载站，下载按钮不该有任何一帧是看不见的 -->
        <div class="flex flex-col gap-md">
            <!-- 主面板 + 侧栏：minmax(0,·) 让轨道可以收窄，
                 长标签（AppImage 等）才挤不出卡片右缘 -->
            <div class="grid gap-md lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <!--
                    主面板：ordered[0]，即检测到的平台（未检测到时是
                    Windows）。「为你推荐」只在真的检测到系统时出现，
                    未检测时不冒充推荐。
                -->
                <div class="card elev-2 flex flex-col gap-lg p-lg sm:gap-xl sm:p-xl lg:p-3xl">
                    <div class="flex items-center gap-md sm:gap-lg">
                        <span
                            class="grid size-12 shrink-0 place-items-center rounded-2xl bg-paper-200 text-slate-900 sm:size-14"
                        >
                            <!-- svg 的尺寸用 class 响应式覆盖 width/height 属性 -->
                            <Icon
                                name={osIcon[primary.id]}
                                size={28}
                                cls="size-6 sm:size-7"
                            />
                        </span>
                        <div class="min-w-0 flex-1">
                            <div
                                class="flex min-w-0 flex-wrap items-center gap-x-sm gap-y-2xs"
                            >
                                <h3
                                    class="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
                                >
                                    {t(primary.nameKey)}
                                </h3>
                                {#if detected === primary.id}
                                    <span
                                        class="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                                    >
                                        {t("dl.recommendedForYou")}
                                    </span>
                                {/if}
                            </div>
                            <p
                                class="truncate text-sm {primary.verified
                                    ? 'text-slate-500'
                                    : 'text-accent-600'}"
                            >
                                {t(primary.statusKey)}
                            </p>
                        </div>
                    </div>

                    {#if primary.downloads.length > 1}
                        {@render tabRail(
                            primary,
                            currentFile(primary),
                            false,
                        )}
                    {/if}

                    {@render pkgZone(primary, false)}
                </div>

                <!--
                    侧栏：其余平台，两座小岛。lg 下 grid-rows-2 平分主面板的高度。
                -->
                <div class="grid gap-md lg:grid-rows-2">
                    {#each rest as group (group.id)}
                        {@const multi = group.downloads.length > 1}
                        <div class="card flex flex-col gap-md p-lg">
                            <!--
                                头部一行：小图标芯片 + 名称/状态；
                                多包平台（Linux 未被检测到时）的 tab 靠
                                ml-auto 推到行尾，单包平台就留白。
                            -->
                            <div class="flex items-center gap-sm">
                                <span
                                    class="grid size-9 shrink-0 place-items-center rounded-xl bg-paper-200 text-slate-800"
                                >
                                    <Icon
                                        name={osIcon[group.id]}
                                        size={18}
                                    />
                                </span>
                                <div class="min-w-0 flex-1">
                                    <h3
                                        class="truncate text-sm font-semibold text-slate-900"
                                    >
                                        {t(group.nameKey)}
                                    </h3>
                                    <p
                                        class="truncate text-xs {group.verified
                                            ? 'text-slate-500'
                                            : 'text-accent-600'}"
                                    >
                                        {t(group.statusKey)}
                                    </p>
                                </div>
                                {#if multi}
                                    {@render tabRail(
                                        group,
                                        currentFile(group),
                                        true,
                                    )}
                                {/if}
                            </div>

                            {@render pkgZone(group, true)}
                        </div>
                    {/each}
                </div>
            </div>

            <!--
                下载源条。每个源是一颗带状态点的小胶囊 ——
                状态点（转圈 / 实心 / 浅色 / 空心）让「正在测速 / 谁更快 / 谁不可用」
                一眼可辨；下面一行通知负责把「自动选中了谁 / 手动切到了谁」说出来。
            -->
            <div
                class="card flex flex-col gap-xs px-lg py-md sm:px-xl"
            >
                <div class="flex flex-col gap-xs sm:flex-row sm:items-center sm:gap-md">
                    <span class="shrink-0 text-xs font-medium text-slate-500">
                        {t("dl.source")}
                    </span>

                    <div
                        class="flex min-w-0 flex-1 flex-wrap items-center gap-1"
                        role="group"
                        aria-label={t("dl.source")}
                    >
                        {#each MIRRORS as m (m.id)}
                            {@const probe = probeFor(m.id)}
                            {@const active = mirror.id === m.id}
                            <button
                                type="button"
                                onclick={() => pickMirror(m)}
                                aria-pressed={active}
                                title={probe
                                    ? probe.ok && probe.ms !== null
                                        ? t("dl.latencyMs", { ms: probe.ms })
                                        : probe.timedOut
                                          ? t("dl.latencyTimeout")
                                          : t("dl.latencyFail")
                                    : t("dl.latencyTesting")}
                                class="relative flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs whitespace-nowrap transition-all duration-200
								{active
                                    ? 'bg-white font-semibold text-slate-900 shadow-xs ring-1 ring-line-strong'
                                    : 'font-medium text-slate-500 hover:bg-paper-200 hover:text-slate-900'}
								{pulseId === m.id ? 'mirror-pulse' : ''}"
                            >
                                <!--
                                    状态点：全站只有 brand/accent/slate 三种色相（见 app.css
                                    取色说明），所以状态语义不靠"红黄绿"，靠"填充深浅 + 实心/空心"：
                                      转圈   = 测速中
                                      实心品牌色 = 快（更快的会被自动选中）
                                      实心浅品牌色 = 可用但较慢
                                      空心灰圈 = 失败/超时/未测
                                -->
                                <span
                                    aria-hidden="true"
                                    class="grid size-3 shrink-0 place-items-center"
                                >
                                    {#if raceState === "racing" && !probe}
                                        <span
                                            class="size-2 animate-spin rounded-full border-[1.5px] border-slate-300 border-t-brand-500"
                                        ></span>
                                    {:else if probe?.ok}
                                        <span
                                            class="size-1.5 rounded-full {(probe.ms ??
                                                9999) < 600
                                                ? 'bg-brand-500'
                                                : 'bg-brand-200'}"
                                        ></span>
                                    {:else if probe && (!probe.ok || probe.timedOut)}
                                        <span
                                            class="size-1.5 rounded-full border-[1.5px] border-slate-400"
                                        ></span>
                                    {:else}
                                        <span
                                            class="size-1.5 rounded-full bg-slate-300"
                                        ></span>
                                    {/if}
                                </span>
                                {m.name}
                            </button>
                        {/each}

                        <!-- 重新自动选择：让「有自动优选这回事」在界面上被明确看见 -->
                        <button
                            type="button"
                            onclick={reAutoPick}
                            disabled={raceState === "racing"}
                            title={t("dl.reAutoTitle")}
                            class="flex min-h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-paper-200 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60 sm:ml-auto"
                        >
                            <Icon
                                name="loader"
                                size={12}
                                cls={raceState === "racing"
                                    ? "animate-spin"
                                    : ""}
                            />
                            {t("dl.reAuto")}
                        </button>
                    </div>
                </div>

                <!--
                    通知条：自动选中/手动切换都在这里说明白，出现几秒后自
                    动淡出。kind 决定图标与色调——auto 用品牌色强调"这是
                    系统帮你做的"，manual 用中性色强调"这是你刚点的"。
                -->
                <div class="grid min-h-[1.375rem]">
                    {#if notice}
                        <div
                            class="col-start-1 row-start-1 flex items-center gap-1.5 text-xs
							{notice.kind === 'auto'
                                ? 'text-brand-700'
                                : notice.kind === 'manual'
                                  ? 'text-slate-600'
                                  : 'text-accent-600'}"
                            role="status"
                            in:fly={{ y: -4, duration: swapMs, easing: cubicOut }}
                            out:fade={{ duration: swapMs }}
                        >
                            <Icon
                                name={notice.kind === "auto"
                                    ? "sparkle"
                                    : notice.kind === "manual"
                                      ? "check"
                                      : "info"}
                                size={12}
                                cls="shrink-0"
                            />
                            <span class="truncate">{notice.text}</span>
                        </div>
                    {:else}
                        {#key mirror.id}
                            <span
                                class="col-start-1 row-start-1 min-w-0 max-w-full truncate text-xs text-slate-400"
                                in:fly={{
                                    y: 4,
                                    duration: swapMs,
                                    easing: cubicOut,
                                }}
                            >
                                {t(mirror.noteKey)}
                            </span>
                        {/key}
                    {/if}
                </div>
            </div>
        </div>

        <!--
            官方桌面端 + 交流群：两张同重量的小卡并排。原来是两条通栏横幅，各带一套
            渐变、徽标和实心按钮，跟上面的下载卡片抢主角。这里一律退成次要层级 ——
            白底描边、文字链接，主 CTA 只留下载卡片里那一个。
        -->
        <div class="grid gap-md sm:grid-cols-2">
            <a
                href={OFFICIAL_DESKTOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="card card-hover group flex items-start gap-md p-lg"
            >
                <span
                    class="grid size-10 shrink-0 place-items-center rounded-xl bg-paper-200 text-slate-700"
                >
                    <Icon name="sparkle" size={18} />
                </span>
                <span class="flex min-w-0 flex-1 flex-col gap-2xs">
                    <span class="text-sm font-semibold text-slate-900">
                        {t("dl.official.title")}
                    </span>
                    <span class="text-xs/relaxed text-pretty text-slate-500">
                        {t("dl.official.desc")}
                    </span>
                    <span
                        class="mt-2xs inline-flex items-center gap-1 text-xs font-semibold text-slate-900 transition-colors group-hover:text-brand-700"
                    >
                        {t("dl.official.cta")}
                        <Icon name="external" size={12} />
                    </span>
                </span>
            </a>

            <div class="card flex items-start gap-md p-lg">
                <span
                    class="grid size-10 shrink-0 place-items-center rounded-xl bg-paper-200 text-slate-700"
                >
                    <Icon name="chat" size={18} />
                </span>
                <div class="flex min-w-0 flex-1 flex-col gap-2xs">
                    <p class="text-sm font-semibold text-slate-900">
                        {t("foot.group")}
                    </p>
                    <p class="text-xs/relaxed text-pretty text-slate-500">
                        {t("dl.groupPrompt")}
                    </p>
                    <button
                        type="button"
                        onclick={copyGroup}
                        class="mt-2xs inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-900 transition-colors hover:text-brand-700"
                        title={t("foot.clickCopy")}
                    >
                        <span class="font-mono">1125671315</span>
                        {#if copiedGroup}
                            <Icon name="check" size={12} cls="text-brand-600" />
                        {:else}
                            <Icon name="copy" size={12} cls="text-slate-400" />
                        {/if}
                    </button>
                </div>
            </div>
        </div>

        <!-- 版本信息与全部资产 -->
        <div
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
                <!--
                    访客数不放这里 —— 它已经在 Footer 里，而 Footer 在根
                    layout 中，首页同样有。放两处只会让同一个数字出现两次。
                -->

            </span>
            <!-- 安装指引从首页搬进了文档，入口挂在这里：下完安装包紧接着就是装 -->
            <span class="flex flex-wrap items-center gap-x-lg gap-y-2xs">
                <a
                    href="{pathForLang(i18n.lang)}docs/install/"
                    class="group inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-brand-700"
                >
                    {t("dl.installHelp")}
                    <Icon
                        name="arrow"
                        size={14}
                        cls="transition-transform group-hover:translate-x-0.5"
                    />
                </a>
                <!-- 搜「dsh desktop 官方 / 官网」的人多半在两者之间选，对比页从首页直达 -->
                <a
                    href="{pathForLang(i18n.lang)}docs/vs-official/"
                    class="group inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-brand-700"
                >
                    {t("dl.vsOfficial")}
                    <Icon
                        name="arrow"
                        size={14}
                        cls="transition-transform group-hover:translate-x-0.5"
                    />
                </a>
                <a
                    href="{REPO_URL}/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-brand-700"
                >
                    {t("dl.allAssets")}
                    <Icon
                        name="external"
                        size={13}
                    />
                </a>
            </span>
        </div>
    </div>
</section>
