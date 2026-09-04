<script lang="ts">
    import CodeBlock from "$lib/components/CodeBlock.svelte";
    import Download from "$lib/components/Download.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import InstallTips from "$lib/components/InstallTips.svelte";
    import Logo from "$lib/components/Logo.svelte";
    import { htmlLang, i18n, pathForLang, LANGS } from "$lib/i18n.svelte";
    import type { MotionHandle, PageMotionHandle } from "$lib/motion";
    import { LATEST_VERSION, REPO_URL, UPSTREAM_URL } from "$lib/releases";
    import { onMount } from "svelte";

    const t = $derived(i18n.t);

    // 站点根地址：canonical / og:url / 结构化数据里的绝对链接都从这里取。
    // 必须是绝对地址 —— 相对路径在被抓取或转发时会解析到错误的源。
    const ORIGIN = "https://dsh-desktop.cc.cd";

    // 本页在当前语言下的绝对地址；canonical / og:url / 结构化数据共用。
    const pageUrl = $derived(`${ORIGIN}${pathForLang(i18n.lang)}`);
    // 截图分语言，og 卡片也要跟着换，否则英文页分享出去是中文界面。
    const ogImage = $derived(
        `${ORIGIN}${i18n.lang === "zh" ? "/preview.png" : "/preview-en.png"}`,
    );

    let pageEl: HTMLElement;
    /**
     * motion 模块是动态 import 的，到位之前是 undefined。
     * 故意不用 $state：下面那个 effect 只该由语言变化驱动，
     * 让它跟着这个赋值再跑一次没有意义（那次 reflow 是空转）。
     */
    let motion: PageMotionHandle | undefined;
    let featViewport: HTMLElement | undefined = $state();
    let featGrid: HTMLElement | undefined = $state();

    onMount(() => {
        /*
            GSAP 走动态 import，不进首屏包。

            这不是可有可无的优化：GSAP + ScrollTrigger + SplitText 约 44KB gzip，
            静态引入会让页面 chunk 从 ~21KB 涨到 ~54KB，直接压在 LCP 前面。
            而本站的 LCP 元素是那张产品截图 —— 让装饰性动画去和它抢带宽，
            是拿真实加载速度换视觉效果，不划算。

            动态引入后：HTML/CSS/截图先到并完整可读，动效随后接管。
            这也正好符合 motion.ts 里「动画是增强而非前置条件」的约束。
        */
        let handles: MotionHandle[] = [];
        let cancelled = false;

        import("$lib/motion").then((m) => {
            // 卸载竞态：模块加载完时组件可能已经销毁了
            if (cancelled) return;

            motion = m.initMotion(pageEl);
            handles.push(motion);
            if (featViewport && featGrid) {
                handles.push(m.initPinnedStack(featViewport, featGrid));
            }
        });

        return () => {
            cancelled = true;
            handles.forEach((h) => h.destroy());
        };
    });

    /*
        切语言之后让动效层跟上：标题被上面那些 {#key} 整块重建过，
        旧的 SplitText 和触发器都指着已经脱离文档的节点了。

        $effect 在 DOM 更新之后跑，这时新文案已经排好版，正好重来一遍。
        比对上一次的值是必需的：effect 首次挂载时也会跑一次，
        那时 motion 还没到位、DOM 也还是初始语言，reflow 纯属空转。
    */
    let reflowedFor = i18n.lang;
    $effect(() => {
        if (i18n.lang === reflowedFor) return;
        reflowedFor = i18n.lang;
        motion?.reflow();
    });

    const features = [
        { icon: "bolt", title: "feat.1.title", body: "feat.1.body" },
        { icon: "layers", title: "feat.2.title", body: "feat.2.body" },
        { icon: "sparkle", title: "feat.3.title", body: "feat.3.body" },
        { icon: "share", title: "feat.4.title", body: "feat.4.body" },
        { icon: "puzzle", title: "feat.5.title", body: "feat.5.body" },
        { icon: "shield", title: "feat.6.title", body: "feat.6.body" },
    ];

    const faqs = [
        { q: "faq.q1", a: "faq.a1" },
        { q: "faq.q2", a: "faq.a2" },
        { q: "faq.q3", a: "faq.a3" },
        { q: "faq.q4", a: "faq.a4" },
        { q: "faq.q5", a: "faq.a5" },
        { q: "faq.q6", a: "faq.a6" },
        { q: "faq.q7", a: "faq.a7" },
    ];

    /*
        FAQ 展开/收起动画。

        原生 <details> 没有可过渡的中间态：open 一变，非 summary 的子元素
        直接进出渲染树，高度是跳变的。所以接管 summary 的点击自己排时序 ——
        展开先把 open 置 true 再从 0 撑到自然高度，收起先播完再把 open 置回 false。
        （不换成 Svelte 的 {#if} + slide：那样答案在收起时会被移出 DOM，
        预渲染的 HTML 里就只剩问题，FAQ 富摘要和站内搜索都会跟着丢。）

        chevron 不能挂 group-open —— 收起时 open 要等动画播完才翻回来，
        箭头会比内容晚 260ms。改用 data-expanded，点下去立刻同步。
    */
    function disclose(el: HTMLDetailsElement) {
        const summary = el.querySelector("summary")!;
        const body = el.querySelector<HTMLElement>("[data-answer]")!;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

        let expanded = el.open;
        let anim: Animation | null = null;

        const sync = () => el.toggleAttribute("data-expanded", el.open);

        const onClick = (e: MouseEvent) => {
            // 约束 C：减少动态效果时不接管，交回浏览器的原生瞬时行为
            if (reduce.matches) return;
            e.preventDefault();

            expanded = !expanded;
            el.toggleAttribute("data-expanded", expanded);

            // 动画进行中再次点击时，起点取当前的视觉高度而不是 0 / 自然高度，
            // 否则反向的那一下会先跳一段再动
            const from = el.open ? body.getBoundingClientRect().height : 0;
            anim?.cancel(); // cancel 不触发 onfinish，收起的收尾回调不会误跑
            el.open = true; // 收起过程中也要保持渲染，否则没得可动

            const to = expanded ? body.offsetHeight : 0;
            anim = body.animate(
                { height: [`${from}px`, `${to}px`] },
                { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
            );
            anim.onfinish = () => {
                anim = null;
                el.open = expanded;
            };
        };

        summary.addEventListener("click", onClick);
        el.addEventListener("toggle", sync);
        sync();

        return {
            destroy() {
                summary.removeEventListener("click", onClick);
                el.removeEventListener("toggle", sync);
                anim?.cancel();
            },
        };
    }

    // 结构化数据：让搜索引擎把 FAQ 收进富摘要。
    // 用 zh 文案生成即可 —— 预渲染产物本身就是中文。
    const faqJsonLd = $derived(
        JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": `${pageUrl}#faq`,
            isPartOf: { "@id": `${pageUrl}#website` },
            mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: t(f.q),
                acceptedAnswer: { "@type": "Answer", text: t(f.a) },
            })),
        }),
    );

    /*
        结构化数据里的 @id 是内部锚点，把 WebSite / SoftwareApplication
        串成一张图，而不是三块互不相干的孤立数据。
        （不写 aggregateRating —— 没有真实评分数据，编一个会被判作垃圾标记。）
    */
    const appJsonLd = $derived(
        JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "WebSite",
                    "@id": `${pageUrl}#website`,
                    url: pageUrl,
                    name: "dsh desktop",
                    description: t("site.desc"),
                    inLanguage: htmlLang(i18n.lang),
                },
                {
                    "@type": "SoftwareApplication",
                    "@id": `${pageUrl}#app`,
                    name: "dsh desktop",
                    description: t("site.desc"),
                    applicationCategory: "DeveloperApplication",
                    operatingSystem: "Windows, macOS, Linux",
                    softwareVersion: LATEST_VERSION,
                    license: "https://opensource.org/licenses/MIT",
                    url: pageUrl,
                    downloadUrl: `${REPO_URL}/releases/latest`,
                    screenshot: ogImage,
                    softwareHelp: `${REPO_URL}#readme`,
                    isBasedOn: UPSTREAM_URL,
                    codeRepository: REPO_URL,
                    isPartOf: { "@id": `${pageUrl}#website` },
                    offers: {
                        "@type": "Offer",
                        price: "0",
                        priceCurrency: "USD",
                    },
                },
            ],
        }),
    );
</script>

<svelte:head>
    <title>{t("site.title")}</title>
    <meta name="description" content={t("site.desc")} />
    <link rel="canonical" href={pageUrl} />

    <!--
        hreflang 必须是双向的：每个语言版本都要列出**全部**版本（含自己），
        只在一边写会被 Google 当作无效标注整组丢掉。
        x-default 指中文页 —— 它是根路径，也是语言不匹配时的兜底。
    -->
    {#each LANGS as l (l)}
        <link
            rel="alternate"
            hreflang={htmlLang(l)}
            href={`${ORIGIN}${pathForLang(l)}`}
        />
    {/each}
    <link rel="alternate" hreflang="x-default" href={`${ORIGIN}/`} />

    <!--
        max-image-preview:large 让搜索结果可以放大展示预览图。
        写在这一页而不是 app.html：404 页面声明的是 noindex，
        两个 robots 标签同时存在时按最严格的合并，容易混淆。
    -->
    <meta name="robots" content="index, follow, max-image-preview:large" />

    <!--
        og:image 的尺寸写死为 1360x900 —— 与 static/preview.png 一致。
        声明尺寸能让抓取方在下图之前就排好卡片版式，避免首次分享时无图。
    -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="dsh desktop" />
    <meta property="og:locale" content={i18n.lang === "zh" ? "zh_CN" : "en_US"} />
    <meta
        property="og:locale:alternate"
        content={i18n.lang === "zh" ? "en_US" : "zh_CN"}
    />
    <meta property="og:title" content={t("site.title")} />
    <meta property="og:description" content={t("site.desc")} />
    <meta property="og:url" content={pageUrl} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1360" />
    <meta property="og:image:height" content="900" />
    <meta property="og:image:alt" content={t("shot.alt")} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={t("site.title")} />
    <meta name="twitter:description" content={t("site.desc")} />
    <meta name="twitter:image" content={ogImage} />
    <meta name="twitter:image:alt" content={t("shot.alt")} />

    {@html `<script type="application/ld+json">${appJsonLd}</script>`}
    {@html `<script type="application/ld+json">${faqJsonLd}</script>`}
</svelte:head>

<!--
    pageEl 是所有动效的查询根：限定在这里，
    就不会误伤 Header / Footer 里的元素。
-->
<div bind:this={pageEl}>
    <!-- ========== Hero ========== -->
    <section class="section-x relative overflow-hidden">
        <!-- 背景：极淡的青→靛柔光。浅底上必须收得很淡，否则像脏了一块。
	     自己 overflow-hidden：光斑宽 70rem，窄视口下会撑出横向滚动。 -->
        <div
            class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
        >
            <!--
            data-parallax 的值是"深度"：越大跟随幅度越大。
            大光斑给小深度、小光斑给大深度，才符合近大远小的直觉。
            注意 -translate-x-1/2 用 CSS 保留，GSAP 只写 x/y，
            两者叠加不冲突（GSAP 走 transform 的独立通道）。
        -->
            <div
                data-parallax="0.25"
                class="absolute -top-48 left-1/2 -ml-140 h-136 w-280 rounded-full bg-brand-300/25 blur-[130px]"
            ></div>
            <div
                data-parallax="0.6"
                class="absolute top-10 right-0 h-80 w-80 rounded-full bg-accent-400/15 blur-[110px]"
            ></div>
        </div>

        <!--
        Hero 垂直节奏全部由这一层 flex + gap 承担：
        logo / 徽标 / 标题组 / 按钮 / 特性行 / 截图 之间不再各自挂 mt-*。
    -->
        <div class="container-page flex flex-col gap-4xl sm:gap-5xl">
            <div class="flex flex-col items-center gap-xl text-center">
                <!-- 品牌鲸鱼：放大展示 -->
                <Logo size={96} />

                <a
                    href="{REPO_URL}/releases/tag/v{LATEST_VERSION}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-xs rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-brand-400 hover:text-slate-900"
                >
                    <span class="relative flex size-1.5">
                        <span
                            class="absolute inline-flex size-full animate-ping rounded-full bg-brand-500 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex size-1.5 rounded-full bg-brand-500"
                        ></span>
                    </span>
                    {t("hero.badge")}
                    <span class="font-mono text-slate-400"
                        >v{LATEST_VERSION}</span
                    >
                </a>

                <!-- 标题 + 副标题是一组，彼此靠得比与外部更近 -->
                <div class="stack-heading">
                    {#key i18n.lang}
                        <!--
                            key 是必需的，不是保险。
                            SplitText 会把标题的 innerHTML 整个换成逐行/逐字的 span，
                            revert() 也只是 innerHTML = 原始字符串 —— 两次都产生新节点，
                            Svelte 在渲染时抓到的那个文本节点从此脱离文档。
                            结果就是切语言时 h1/h2 纹丝不动，必须刷新页面。
                            用 lang 做 key，让 Svelte 整块重建标题，拿到的就是全新的节点。
                            （其余文案不受影响：只有带 data-split 的元素会被拆。）
                        -->
                        <h1
                            data-split
                            class="text-[2rem]/[1.15] font-bold tracking-tight text-balance text-slate-900 sm:text-5xl sm:leading-[1.1] lg:text-6xl"
                        >
                            {t("hero.title1")}
                            <!--
                            data-nosplit：这段等宽的产品名是一个整体，
                            被 SplitText 逐行拆开会在换行处断成两半。
                            整体作为一个动画单元参与入场即可。
                        -->
                            <code
                                data-nosplit
                                class="font-mono text-[0.85em] text-brand-600"
                                >{t("hero.titleCode")}</code
                            >
                            {t("hero.title2")}
                        </h1>
                    {/key}

                    <p
                        class="mx-auto text-base/relaxed text-pretty text-slate-600 sm:text-lg/relaxed"
                    >
                        {t("hero.sub")}
                    </p>
                </div>

                <!-- 按钮组与其下的特性行同属"行动区"，用 md 收紧成一块 -->
                <div class="flex flex-col items-center gap-xl">
                    <div class="cluster-cta w-full">
                        <a
                            href="#download"
                            class="flex min-h-12 w-full items-center justify-center gap-xs rounded-xl bg-ink-900 px-6 font-semibold text-white shadow-sm transition-colors hover:bg-ink-800 sm:w-auto"
                        >
                            <Icon name="download" size={18} />
                            {t("hero.cta")}
                        </a>
                        <a
                            href={REPO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex min-h-12 w-full items-center justify-center gap-xs rounded-xl border border-line bg-white px-6 font-semibold text-slate-800 shadow-sm transition-colors hover:border-line-strong hover:bg-paper-100 sm:w-auto"
                        >
                            <Icon name="github" size={18} />
                            {t("hero.cta2")}
                        </a>
                    </div>

                    <div
                        class="flex flex-wrap items-center justify-center gap-x-lg gap-y-xs text-xs text-slate-500"
                    >
                        <span class="flex items-center gap-2xs">
                            <Icon
                                name="check"
                                size={13}
                                cls="text-brand-600"
                            />{t("hero.platforms")}
                        </span>
                        <span class="flex items-center gap-2xs">
                            <Icon
                                name="check"
                                size={13}
                                cls="text-brand-600"
                            />{t("hero.free")}
                        </span>
                        <span class="flex items-center gap-2xs">
                            <Icon
                                name="check"
                                size={13}
                                cls="text-brand-600"
                            />{t("hero.ctaSub")}
                        </span>
                    </div>
                </div>
            </div>

            <!--
            产品截图：与上方文案的距离由父级 gap 统一给出。
            外层负责 perspective（GSAP 会写进来），内层才是被旋转的对象 ——
            透视必须挂在父级，挂自己身上 rotateX 出不来立体感。
        -->
            <div>
                <div
                    data-shot
                    class="overflow-hidden rounded-xl border border-line bg-white elev-3 sm:rounded-2xl"
                >
                    <img
                        src={i18n.lang === "zh"
                            ? "/preview.png"
                            : "/preview-en.png"}
                        alt={t("shot.alt")}
                        width="1360"
                        height="900"
                        loading="eager"
                        fetchpriority="high"
                        class="block w-full"
                    />
                </div>
            </div>
        </div>
    </section>

    <!-- ========== 特性 ========== -->
    <!--
        ── 特性区：宽屏 pin 住，卡片初始堆叠在右下角，随滚动展开成两行 ──

        动画由 motion.ts 的 initPinnedStack 驱动：
        滚动经过这一屏时，section 固定在视口，6 张卡片从右下角同一处
        逐张展开到 3×2 的两行网格位置。

        两套 DOM（宽屏 pin / 窄屏网格）而不是一套 + CSS 切换：
        pin 需要"视口容器"结构，窄屏只是普通网格，分开更稳。

        窄屏那套是纯静态的，不加载任何动画逻辑。
    -->
    <section
        id="features"
        class="section-x scroll-mt-20 border-t border-line bg-white lg:py-0!"
    >
        <!--
            宽屏：pin + 展开动画。

            高度撑满视口并垂直居中：pin 期间这一屏是一整屏内容，
            减去顶栏 64px 才不会被导航遮住。
        -->
        <div
            bind:this={featViewport}
            class="relative hidden min-h-[calc(100dvh-4rem)] flex-col justify-center lg:flex"
        >
            <div class="container-page stack-section">
                <div class="stack-heading">
                    {#key i18n.lang}
                        <!-- 同 hero：被 SplitText 拆过的标题只能整块重建，见那里的说明 -->
                        <h2
                            data-split
                            class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                        >
                            {t("feat.heading")}
                        </h2>
                    {/key}
                    <p
                        class="text-base/relaxed text-slate-600 sm:text-lg/relaxed"
                    >
                        {t("feat.sub")}
                    </p>
                </div>

                <!--
                    两行网格（lg 下 3 列 × 2 行）是卡片的最终落位。
                    卡片外面包一层 wrapper：动画动的是 wrapper，
                    不直接动卡片 —— 卡片自己挂着 card-hover 的 transform 过渡，
                    GSAP 直接改卡片 transform 会和 CSS 过渡互相打架。
                -->
                <div bind:this={featGrid} class="grid gap-lg lg:grid-cols-3">
                    {#each features as f (f.title)}
                        <div class="will-change-transform">
                            <!-- 卡片内部：图标 → 标题 → 正文，标题与正文更紧 -->
                            <div
                                class="card card-hover flex h-full flex-col gap-md p-lg sm:p-xl"
                            >
                                <div
                                    class="grid size-11 place-items-center rounded-xl bg-linear-to-br from-brand-50 to-accent-50 text-brand-700 ring-1 ring-brand-100"
                                >
                                    <Icon name={f.icon} size={20} />
                                </div>
                                <div class="stack-tight">
                                    <h3 class="font-semibold text-slate-900">
                                        {t(f.title)}
                                    </h3>
                                    <p class="text-sm/relaxed text-slate-600">
                                        {t(f.body)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!--
            窄屏：标题 + 普通网格。
            两者同属一个 stack-section，间距交给父级 gap ——
            和本页其他区块保持同一套节奏，不额外挂 mt-*。
        -->
        <div class="container-page stack-section lg:hidden">
            <div class="stack-heading">
                {#key i18n.lang}
                    <!-- 同 hero：被 SplitText 拆过的标题只能整块重建，见那里的说明 -->
                    <h2
                        data-split
                        class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                    >
                        {t("feat.heading")}
                    </h2>
                {/key}
                <p class="text-base/relaxed text-slate-600 sm:text-lg/relaxed">
                    {t("feat.sub")}
                </p>
            </div>
            <div data-stagger class="grid gap-md sm:grid-cols-2 sm:gap-lg">
                {#each features as f (f.title)}
                    <!-- 卡片内部：图标 → 标题 → 正文，标题与正文更紧 -->
                    <div
                        class="card card-hover flex flex-col gap-md p-lg sm:p-xl"
                    >
                        <div
                            class="grid size-11 place-items-center rounded-xl bg-linear-to-br from-brand-50 to-accent-50 text-brand-700 ring-1 ring-brand-100"
                        >
                            <Icon name={f.icon} size={20} />
                        </div>
                        <div class="stack-tight">
                            <h3 class="font-semibold text-slate-900">
                                {t(f.title)}
                            </h3>
                            <p class="text-sm/relaxed text-slate-600">
                                {t(f.body)}
                            </p>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- ========== 下载 ========== -->
    <Download />

    <!-- ========== 安装提示 ========== -->
    <!-- 终端窗：OS 标签切换翻卡 + 命令打字机，见 InstallTips.svelte -->
    <InstallTips />

    <!-- ========== 插件 ========== -->
    <section
        id="plugins"
        class="section-x scroll-mt-20 border-y border-line bg-paper-200/60"
    >
        <div class="container-page">
            <div
                class="grid grid-cols-1 gap-3xl lg:grid-cols-2 lg:items-center lg:gap-4xl"
            >
                <div class="stack-section">
                    <div class="stack-heading">
                        {#key i18n.lang}
                            <!-- 同 hero：被 SplitText 拆过的标题只能整块重建，见那里的说明 -->
                            <h2
                                data-split
                                class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                            >
                                {t("plug.heading")}
                            </h2>
                        {/key}
                        <p
                            class="text-base/relaxed text-slate-600 sm:text-lg/relaxed"
                        >
                            {t("plug.sub")}
                        </p>
                    </div>

                    <!-- 两条特性并列：用 gap 代替 space-y -->
                    <div class="flex flex-col gap-xl">
                        <div data-plug-item class="flex gap-md">
                            <div
                                class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-line"
                            >
                                <Icon name="puzzle" size={18} />
                            </div>
                            <div class="stack-tight">
                                <h3 class="font-semibold text-slate-900">
                                    {t("plug.1.title")}
                                </h3>
                                <p class="text-sm/relaxed text-slate-600">
                                    {t("plug.1.body")}
                                </p>
                            </div>
                        </div>
                        <div data-plug-item class="flex gap-md">
                            <div
                                class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-line"
                            >
                                <Icon name="terminal" size={18} />
                            </div>
                            <div class="stack-tight">
                                <h3 class="font-semibold text-slate-900">
                                    {t("plug.2.title")}
                                </h3>
                                <p class="text-sm/relaxed text-slate-600">
                                    {t("plug.2.body")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    data-plug-card
                    class="card flex flex-col gap-lg p-lg sm:p-xl"
                >
                    <p
                        class="flex items-start gap-sm text-sm/relaxed text-slate-600"
                    >
                        <Icon
                            name="info"
                            size={16}
                            cls="mt-0.5 shrink-0 text-accent-500"
                        />
                        <span>{t("plug.note")}</span>
                    </p>
                    <CodeBlock
                        code={"$DSH_HOME/profiles/web/pnpm-workspace.yaml"}
                    />
                </div>
            </div>
        </div>
    </section>

    <!-- ========== FAQ ========== -->
    <section id="faq" class="section-x scroll-mt-20 bg-white">
        <div class="container-page stack-section">
            {#key i18n.lang}
                <!-- 同 hero：被 SplitText 拆过的标题只能整块重建，见那里的说明 -->
                <h2
                    data-split
                    class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                >
                    {t("faq.heading")}
                </h2>
            {/key}

            <div class="divide-y divide-line">
                {#each faqs as f (f.q)}
                    <!--
                        问答间距挂在答案的 pt-sm 上，不用 details 的 gap ——
                        gap 不参与高度动画，收起到最后会剩一道空隙突然消失。
                    -->
                    <details use:disclose class="group py-md sm:py-lg">
                        <summary
                            class="flex cursor-pointer list-none items-center justify-between gap-md font-medium text-slate-900 marker:hidden hover:text-brand-700"
                        >
                            {t(f.q)}
                            <Icon
                                name="chevron"
                                size={18}
                                cls="shrink-0 text-slate-400 transition-transform group-data-expanded:rotate-180"
                            />
                        </summary>
                        <div data-answer class="overflow-hidden">
                            <p
                                class="pt-sm text-sm/relaxed text-slate-600 max-w-245"
                            >
                                {t(f.a)}
                            </p>
                        </div>
                    </details>
                {/each}
            </div>
        </div>
    </section>

    <!-- ========== 结束 CTA ========== -->
    <section class="section-x border-t border-line">
        <div class="container-page">
            <div
                class="relative overflow-hidden rounded-3xl border border-line bg-linear-to-br from-brand-50 via-white to-accent-50 px-lg py-4xl text-center shadow-sm sm:px-14 sm:py-5xl"
            >
                <div
                    data-parallax="0.35"
                    class="pointer-events-none absolute -top-28 left-1/2 -ml-80 h-64 w-160 max-w-none rounded-full bg-brand-300/25 blur-[90px]"
                    aria-hidden="true"
                ></div>

                <div class="relative flex flex-col items-center gap-2xl">
                    <div class="stack-heading">
                        {#key i18n.lang}
                            <!-- 同 hero：被 SplitText 拆过的标题只能整块重建，见那里的说明 -->
                            <h2
                                data-split
                                class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                            >
                                {t("cta.heading")}
                            </h2>
                        {/key}
                        <p
                            class="text-base/relaxed text-slate-600 sm:text-lg/relaxed"
                        >
                            {t("cta.sub")}
                        </p>
                    </div>

                    <div class="cluster-cta w-full">
                        <a
                            href="#download"
                            class="flex min-h-12 w-full items-center justify-center gap-xs rounded-xl bg-ink-900 px-6 font-semibold text-white shadow-sm transition-colors hover:bg-ink-800 sm:w-auto"
                        >
                            <Icon name="download" size={18} />
                            {t("cta.button")}
                        </a>
                        <a
                            href={UPSTREAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex min-h-12 w-full items-center justify-center gap-xs rounded-xl border border-line bg-white px-6 font-semibold text-slate-800 transition-colors hover:border-line-strong hover:bg-paper-100 sm:w-auto"
                        >
                            {t("foot.upstream")}
                            <Icon name="external" size={15} />
                        </a>
                    </div>

                    <p class="text-xs/relaxed text-slate-500">
                        <strong class="font-semibold text-slate-700"
                            >{t("foot.disclaimerTitle")}</strong
                        >
                        · {t("foot.disclaimer")}
                    </p>
                </div>
            </div>
        </div>
    </section>
</div>
<!-- /pageEl -->
