<script lang="ts">
    /*
        ── 安装提示 · 终端风格多卡片 ────────────────────────────────

        做成四张终端风格的卡片（桌面端 2×2），每张卡带一个深色命令区，
        命令用打字机逐字敲出。卡片入场用「淡出 + 上滑」交错，干净不晃眼；
        命令区本身不做展开/淡入，只有里面的字符逐个敲出。

        动效全部走 GSAP（动态 import，不进首屏包），遵守 motion.ts 约束：

          A. 不做 CSS opacity:0 预设 —— 预渲染 HTML 一到就完整可读。
             初始态（隐藏字符/位移）由 JS 在入场时写入；
             JS 失败/被拦截 = 全内容原样可见。
          B. 复制按钮永不参与入场，始终可点。
          C. reduce-motion 分支：命中时不入场、不打字，内容直接呈现。
    */

    import { afterFirstPaint } from "$lib/after-paint";
    import { i18n } from "$lib/i18n.svelte";
    import type { MotionHandle } from "$lib/motion";
    import { LATEST_VERSION } from "$lib/releases";
    import Icon from "./Icon.svelte";

    const t = $derived(i18n.t);

    const tips = [
        { id: "windows", icon: "windows", titleKey: "tip.win.title", bodyKey: "tip.win.body", code: null as string | null },
        {
            id: "macos",
            icon: "apple",
            titleKey: "tip.mac.title",
            bodyKey: "tip.mac.body",
            code: "xattr -dr com.apple.quarantine /Applications/dsh-desktop.app",
        },
        {
            id: "linux",
            icon: "linux",
            titleKey: "tip.linux.title",
            bodyKey: "tip.linux.body",
            code: `chmod +x dsh-desktop_${LATEST_VERSION}_amd64.AppImage\n./dsh-desktop_${LATEST_VERSION}_amd64.AppImage`,
        },
        {
            id: "cn",
            icon: "bolt",
            titleKey: "tip.cn.title",
            bodyKey: "tip.cn.body",
            code: "npm config set registry https://registry.npmmirror.com",
        },
    ];

    // ── 状态 ──────────────────────────────────────────────────────
    let reduceMotion = $state(false);

    // 监听 reduce-motion；下面的入场 $effect 读了它，切换时会自行重建/拆除
    $effect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        reduceMotion = mq.matches;
        const onChange = (e: MediaQueryListEvent) => (reduceMotion = e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    });

    // ── 复制命令 ──────────────────────────────────────────────────
    let copied = $state<string | null>(null);
    let copyError = $state(false);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;
    $effect(() => () => clearTimeout(copyTimer));

    function copyCmd(id: string, code: string) {
        clearTimeout(copyTimer);
        copyError = false;
        try {
            navigator.clipboard.writeText(code);
            copied = id;
        } catch {
            copyError = true;
            copied = id;
        }
        copyTimer = setTimeout(() => {
            copied = null;
            copyError = false;
        }, 2000);
    }

    // ── GSAP：入场（淡出上滑交错）+ 打字机 ───────────────────────

    /**
     * 把一段命令区文本包成字符 span（保留换行），从左到右逐个显现。
     * 打字时机由这张卡自己入场结束后的 typeCodes(card) 触发。
     */
    function typeElement(pre: HTMLElement) {
        const text = pre.textContent ?? "";
        if (!text) return;
        pre.textContent = "";
        const frag = document.createDocumentFragment();
        const chars: HTMLElement[] = [];
        for (const ch of text) {
            const s = document.createElement("span");
            s.textContent = ch;
            frag.appendChild(s);
            // 换行只是排版，不逐个显现 —— 也就不打 .ts-char 标记，
            // 免得被按 .ts-char 取字符的地方算进去
            if (ch !== "\n") {
                s.className = "ts-char";
                chars.push(s);
            }
        }
        pre.appendChild(frag);
        return chars;
    }

    /**
     * 先把所有命令拆成字符并藏起来。
     *
     * 必须在 revealBatch 之前跑完：拆字放到卡片浮起之后（原来那样）的话，
     * 完整命令会先原样露出小半秒，再被 textContent="" 抹掉重敲 —— 一闪一顿。
     * 提前到这里，藏字和 revealBatch 把卡片设成 opacity:0 是同一帧，看不见。
     *
     * 仍然不违反约束 A：初始态由 JS 写入，gsap 没加载起来 = 命令原样可读。
     */
    function hideCodes(gsap: typeof import("gsap").gsap, grid: HTMLElement) {
        grid.querySelectorAll<HTMLElement>("[data-code]").forEach((code) => {
            const chars = typeElement(code);
            if (chars?.length) gsap.set(chars, { autoAlpha: 0 });
        });
    }

    /** 敲出这张卡里的命令 */
    function typeCodes(gsap: typeof import("gsap").gsap, card: Element) {
        const chars = card.querySelectorAll(".ts-char");
        if (!chars.length) return;
        gsap.to(chars, {
            autoAlpha: 1,
            duration: 0.02,
            ease: "steps(1)",
            stagger: 0.03,
        });
    }

    /*
        入场：每张卡各自一个触发器（revealBatch），进了视口才动，两拍分开 ——
        卡片浮起 → 落地后逐字敲出。命令区那层深色块不参与动画。

        原来是整个 grid 一个触发器 + onComplete 里给四段命令一起开敲：
        窄屏单列时 grid 比视口高得多，顶部一露头动画就整批开跑，
        后两张在离视口还有一屏多的时候就已经播完、命令也敲完了 ——
        用户滚到时看到的是静止的终态。
    */
    let gridEl: HTMLElement | undefined = $state();
    $effect(() => {
        const grid = gridEl;
        if (!grid || reduceMotion) return;

        let handle: MotionHandle | undefined;
        let restore: (() => void) | undefined;
        let cancelled = false;

        /*
            同首页：等首屏画完再动手，理由见 afterFirstPaint。
            这一段尤其不能提前 —— hideCodes 会把四段命令拆成上百个 span
            再逐个 gsap.set，是一大块压在 LCP 前面的 DOM 写入 + 强制重排。
            反正这一屏在首屏之外，晚几百毫秒开始没有任何可感知的差别。
        */
        const stopWaiting = afterFirstPaint(() => {
            Promise.all([import("gsap"), import("$lib/motion")]).then(
                ([{ gsap }, { revealBatch }]) => {
                    if (cancelled) return;

                    hideCodes(gsap, grid);
                    handle = revealBatch(
                        Array.from(grid.children) as HTMLElement[],
                        (cards) =>
                            cards.forEach((card) => typeCodes(gsap, card)),
                    );

                    // 中途被拆掉（卸载 / 开启 reduce-motion）时把还没显现的字符
                    // 还原，否则剩下的字永久不可见
                    restore = () =>
                        gsap.set(grid.querySelectorAll(".ts-char"), {
                            clearProps: "all",
                        });
                },
            );
        });

        return () => {
            cancelled = true;
            stopWaiting();
            handle?.destroy();
            restore?.();
        };
    });
</script>

<section class="section-x bg-white">
    <div class="container-page stack-section">
        {#key i18n.lang}
            <!-- 同首页标题：被 SplitText 拆过之后只能整块重建，见 +page.svelte 里的说明 -->
            <h2
                data-split
                class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
                {t("tip.heading")}
            </h2>
        {/key}

        <!--
            四张终端风格卡片，桌面端 2×2。
            入场由上面的 $effect 用 GSAP 淡出+上滑交错驱动。
        -->
        <div
            bind:this={gridEl}
            class="grid grid-cols-1 gap-md sm:gap-lg lg:grid-cols-2"
        >
            {#each tips as tip (tip.id)}
                <!--
                    卡片本身是 subgrid：头部 / 描述 / 命令区这三块直接落在
                    父网格的行轨道上，同一行两张卡的对应块因此共用一条基线。
                    换成 flex 就只有卡片外框等高、内部各排各的 —— 描述行数
                    一多一少，下面的代码框跟着错开（现在看到的就是这个）。

                    代价：卡片必须**恰好三个直接子元素**，多一个就挤进第四行、
                    整行对齐作废 —— 命令区连同它的复制反馈只能算作一格。
                -->
                <!--
                    grid-cols-1 不是多余的：只写 grid-rows-subgrid 的话列轨道是隐式的
                    `auto`，会按 max-content 撑开 —— 窄屏上那条命令有 515px 宽，
                    轨道就跟着变 515px，<pre> 填满轨道后内容没超出自己，
                    overflow-x-auto 永远不触发，深色块直接冲出卡片右缘
                    （实测 375px 下越界 224px，整页还多出 183px 横向滚动）。
                    grid-cols-1 给的是 minmax(0, 1fr)，轨道下限归零，
                    命令区这才回到卡片宽度里，超长命令改为块内横向滚动。
                -->
                <article
                    class="card row-span-3 grid grid-cols-1 grid-rows-subgrid gap-md p-lg sm:p-xl"
                >
                    <!-- 头部：图标 + 标题 -->
                    <div class="flex items-center gap-sm">
                        <span
                            class="grid size-8 shrink-0 place-items-center rounded-lg bg-paper-200 text-brand-700"
                        >
                            <Icon name={tip.icon} size={17} />
                        </span>
                        <h3 class="font-semibold text-slate-900">
                            {t(tip.titleKey)}
                        </h3>
                    </div>

                    <!-- 正文 -->
                    <p class="text-sm/relaxed text-slate-600">
                        {t(tip.bodyKey)}
                    </p>

                    <!-- 命令区（终端风格）/ 无命令提示 -->
                    {#if tip.code}
                        <!--
                            命令区这一格只放这一个盒子，h-full 把它撑满整格：
                            只对齐上沿的话，一行命令和两行命令的深色块下沿
                            仍然是错的（Linux 那张是两行）。
                        -->
                        <div class="relative">
                            <pre
                                class="h-full overflow-x-auto rounded-xl border border-line bg-ink-900 px-4 py-3 pr-12 font-mono text-[13px]/relaxed text-brand-200"
                            ><code data-code>$ {tip.code}</code></pre>
                            <!--
                                复制按钮所在的那一档右侧留白来自 pre 的 pr-12，
                                但那是**内容尾部**的 padding：命令一超宽、滚动位置在最左时，
                                这段留白被推到视口外，文字就直接压在按钮底下。
                                所以再铺一层贴着块右缘的渐隐罩 —— 文字滑到按钮前先淡掉，
                                滚到尽头时 pr-12 又保证最后几个字符不被挡。
                            -->
                            <span
                                aria-hidden="true"
                                class="pointer-events-none absolute inset-y-px right-px w-14 rounded-r-xl bg-linear-to-l from-ink-900 from-55% to-transparent"
                            ></span>
                            <button
                                type="button"
                                onclick={() => copyCmd(tip.id, tip.code!)}
                                class="absolute top-2 right-2 grid size-8 place-items-center rounded-lg bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
                                aria-label={copied === tip.id ? t("dl.copied") : t("dl.copy")}
                                title={copyError && copied === tip.id ? t("dl.copyFail") : copied === tip.id ? t("dl.copied") : t("dl.copy")}
                            >
                                <Icon
                                    name={copied === tip.id && !copyError ? "check" : "copy"}
                                    size={14}
                                />
                            </button>
                            <!--
                                复制反馈看按钮那个对勾（同 CodeBlock），这条只给读屏。
                                原来它是流内的一行小字：一点复制就把这一格顶高，
                                subgrid 下会连着把同一行另一张卡也撑高，
                                而这一格被 h-full 撑满时反过来还会把代码框压扁。
                                sr-only 不占布局，且 live region 要一直在 DOM 里
                                才会被播报，所以不加 {#if}，只换文本。
                            -->
                            <p class="sr-only" role="status">
                                {copied === tip.id
                                    ? copyError
                                        ? t("dl.copyFail")
                                        : t("dl.copied")
                                    : ""}
                            </p>
                        </div>
                    {:else}
                        <!-- Windows：无可执行命令，给一条即用提示 -->
                        <div class="flex items-center gap-sm rounded-xl border border-dashed border-line px-4 py-3 text-[13px] text-slate-500">
                            <Icon name="check" size={14} cls="shrink-0 text-brand-500" />
                            <span>{t("tip.win.ready")}</span>
                        </div>
                    {/if}
                </article>
            {/each}
        </div>
    </div>
</section>
