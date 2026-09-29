<script lang="ts">
    import Download from "$lib/components/Download.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import { htmlLang, i18n, pathForLang, LANGS } from "$lib/i18n.svelte";
    import {
        assetSize,
        formatCount,
        formatSize,
        GITHUB_DOWNLOADS,
        LICENSE,
        LATEST_VERSION,
        OS_GROUPS,
        PHONE_STABLE,
        PREVIEW,
        RELEASE_DATE,
        REPO_OWNER,
        REPO_OWNER_URL,
        REPO_URL,
        TOTAL_DOWNLOADS,
        UPSTREAM_URL,
        OFFICIAL_DESKTOP_URL,
        MARKET_URL,
    } from "$lib/releases";
    import { ORIGIN } from "$lib/site";
    import { ensureVisitorCount, visitorCount } from "$lib/visitors.svelte";
    import { onMount } from "svelte";

    const t = $derived(i18n.t);

    // 本页在当前语言下的绝对地址；canonical / og:url / 结构化数据共用。
    const pageUrl = $derived(`${ORIGIN}${pathForLang(i18n.lang)}`);
    /*
        og 卡片和站内截图是两张不同的图，别混用：

        - og.png 是 1200x630 的专用分享图（Twitter 的 summary_large_image 按 2:1、
          Facebook 按 1.91:1 裁，直接丢 1360x900 的截图进去会被切掉上下）。
          它带了品名和一句话说明 —— 缩略图尺寸下截图本身几乎全是白底，读不出信息。
        - preview.png 是真实截图，给结构化数据的 screenshot 字段用。

        两者都分语言，否则英文页分享出去是中文界面。
    */
    const ogCard = $derived(
        `${ORIGIN}${i18n.lang === "zh" ? "/og.png" : "/og-en.png"}`,
    );
    /*
        截图的路径基名。同一张图有 4 个衍生文件：
        {base}.avif / {base}.webp（1360w）和 {base}-sm.*（680w）。
        png 只留 1360 那一张，作为 <picture> 兜底和结构化数据的 screenshot。
    */
    const shotBase = $derived(i18n.lang === "zh" ? "/preview" : "/preview-en");
    const screenshot = $derived(`${ORIGIN}${shotBase}.png`);
    /*
        截图的渲染宽度完全由 container-page + section-x 决定（见 app.css）：
          lg 及以上  min(1240px, 100vw - 200px)
          lg 以下    min(700px,  100vw - 40px)
        这串 sizes 必须跟着那两个值走，写错的话浏览器会挑错档 ——
        偏小是糊，偏大是白下载。
    */
    const SHOT_SIZES =
        "(min-width: 1440px) 1240px, (min-width: 1024px) calc(100vw - 200px), (min-width: 740px) 700px, calc(100vw - 40px)";
    /*
        avif 的 srcset 被 <picture> 和 <head> 里的 preload 共用。
        提成一个值就是为了让两处永远不可能漂移 —— 一旦漂移，
        preload 拿到的候选和 <picture> 最终选的不是同一张，就是白下一份。
    */
    const shotAvifSrcset = $derived(
        `${shotBase}-sm.avif 680w, ${shotBase}.avif 1360w`,
    );

    /*
        首屏的三个数字。

        下载量是构建期烤进 HTML 的（见 releases.ts 的 TOTAL_DOWNLOADS），
        访问人数要到浏览器里才拿得到 —— 预渲染时先亮占位数，真数到了再覆盖
        （见 $lib/visitors）。两个数字都是 tabular-nums，换数时不会把旁边挤动。

        下载量是估算，口径和统计间隔必须能被看到：放进 title，和下载区那行
        「每 24 小时更新」是同一段说明。

        体积取 Windows 安装包的真实字节数 —— 它是最小的那个，取不到就不显示这一格。
    */
    onMount(ensureVisitorCount);

    const smallest = assetSize(OS_GROUPS[0].downloads[0].file);
    const stats = $derived(
        [
            TOTAL_DOWNLOADS > 0 && {
                label: t("hero.stat.downloads"),
                value: formatCount(TOTAL_DOWNLOADS),
                title: `${t("dl.downloadsNote")} ${formatCount(GITHUB_DOWNLOADS)} · ${t("dl.downloadsCadence")}`,
            },
            {
                label: t("hero.stat.visitors"),
                value: formatCount(visitorCount() ?? 0),
                title: t("visitors.note"),
            },
            smallest !== null && {
                label: t("hero.stat.size"),
                value: formatSize(smallest),
                title: OS_GROUPS[0].downloads[0].file,
            },
        ].filter((s) => !!s),
    );

    const features = [
        { icon: "bolt", title: "feat.1.title", body: "feat.1.body" },
        { icon: "sparkle", title: "feat.2.title", body: "feat.2.body" },
        { icon: "puzzle", title: "feat.3.title", body: "feat.3.body" },
        { icon: "lifebuoy", title: "feat.4.title", body: "feat.4.body" },
        { icon: "bell", title: "feat.5.title", body: "feat.5.body" },
        { icon: "layers", title: "feat.6.title", body: "feat.6.body" },
    ];

    const channels = [
        { icon: "wifi", title: "phone.lan", body: "phone.lanBody" },
        { icon: "share", title: "phone.ts", body: "phone.tsBody" },
        { icon: "globe", title: "phone.cf", body: "phone.cfBody" },
    ];

    const plugins = [
        { icon: "store", title: "plug.1.title", body: "plug.1.body" },
        { icon: "lifebuoy", title: "plug.2.title", body: "plug.2.body" },
        { icon: "terminal", title: "plug.3.title", body: "plug.3.body" },
    ];

    const home = $derived(pathForLang(i18n.lang));

    /*
        结构化数据里的 @id 是内部锚点，把 WebSite / SoftwareApplication
        串成一张图，而不是三块互不相干的孤立数据。
        （不写 aggregateRating —— 没有真实评分数据，编一个会被判作垃圾标记。）
    */
    const appJsonLd = $derived(
        JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
                /*
                    作者实体。@id 用 ORIGIN 而不是 pageUrl —— 中英文是同一个
                    作者，两页指向同一个节点才能被合并成一个实体；
                    跟着 pageUrl 走会变成两个同名但互不相干的人。

                    url 指 GitHub 主页：那是这个人在网上可被指认的身份页。
                    不写 sameAs —— 只有这一个标识地址时，再列一遍同样的 URL
                    是纯噪音；将来有别的公开主页再加。
                    也不写 image/logo：icon-512.png 是应用图标，不是这个人的照片。
                */
                {
                    "@type": "Person",
                    "@id": `${ORIGIN}/#author`,
                    name: REPO_OWNER,
                    url: REPO_OWNER_URL,
                },
                {
                    "@type": "WebSite",
                    "@id": `${pageUrl}#website`,
                    url: pageUrl,
                    name: "dsh desktop",
                    description: t("site.desc"),
                    inLanguage: htmlLang(i18n.lang),
                    publisher: { "@id": `${ORIGIN}/#author` },
                },
                {
                    "@type": "SoftwareApplication",
                    "@id": `${pageUrl}#app`,
                    name: "dsh desktop",
                    description: t("site.desc"),
                    applicationCategory: "DeveloperApplication",
                    operatingSystem: "Windows, macOS, Linux",
                    softwareVersion: LATEST_VERSION,
                    license: `https://spdx.org/licenses/${LICENSE.spdx}.html`,
                    url: pageUrl,
                    downloadUrl: `${REPO_URL}/releases/latest`,
                    screenshot,
                    softwareHelp: `${REPO_URL}#readme`,
                    isBasedOn: UPSTREAM_URL,
                    codeRepository: REPO_URL,
                    isPartOf: { "@id": `${pageUrl}#website` },
                    author: { "@id": `${ORIGIN}/#author` },
                    releaseNotes: `${REPO_URL}/releases/tag/v${LATEST_VERSION}`,
                    /*
                        取不到发布时间就整个字段不写。见 RELEASE_DATE 的说明：
                        编一个日期会让结构化数据和 sitemap 一起变得不可信。
                    */
                    ...(RELEASE_DATE ? { datePublished: RELEASE_DATE } : {}),
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
        首屏截图（LCP 元素）的预加载。

        原来这里是空的，理由是「预扫描器本来就能发现 <picture>」——
        发现得到，但**排不到前面**：SvelteKit 会在 head 里先放一串
        modulepreload，图片请求排在它们后面，实测「资源加载延迟」410ms。
        这条 preload 写在 head 靠前的位置，把它提回队首。

        只预加载 avif：type 让不支持的浏览器直接跳过这条，自己按
        <picture> 的顺序去取 webp，不会多下一份。
        srcset/sizes 与下面的 <picture> 共用同一组常量，不会漂移。

        ⚠️ href 是必需的，别删。

        imagesrcset/imagesizes 只是「修饰符」，真正标识资源的是 href。
        少了它，这条 preload 在移动端 Safari 上匹配不到下面那个 <img>：
        预载进来的位图成了一份无主资源，跟着 <picture> 自己那份一起画出来 ——
        表现就是首屏截图下面多出一张一模一样的图，而且只有首次访问会出现
        （刷新后候选都在 HTTP 缓存里，<picture> 解析期就命中，孤儿那份没机会上屏）。
        再加上当时的 motion.ts 取的是 [data-shot] 的**第一个**，
        倾斜只作用在真正的那张上，多出来的那张是平的 —— 正是那个 bug 的样子。

        href 取 1360w 那张，和 imagesrcset 里的最大候选保持一致：
        支持 imagesrcset 的浏览器按 srcset/sizes 自己挑档，href 只作兜底键值，
        不会造成重复下载。
    -->
    <link
        rel="preload"
        as="image"
        type="image/avif"
        href="{shotBase}.avif"
        imagesrcset={shotAvifSrcset}
        imagesizes={SHOT_SIZES}
        fetchpriority="high"
    />

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
        声明尺寸能让抓取方在下图之前就排好卡片版式，避免首次分享时无图。
        1200x630 与 static/og.png 一致，改图时两处要一起改。
    -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="dsh desktop" />
    <meta
        property="og:locale"
        content={i18n.lang === "zh" ? "zh_CN" : "en_US"}
    />
    <meta
        property="og:locale:alternate"
        content={i18n.lang === "zh" ? "en_US" : "zh_CN"}
    />
    <meta property="og:title" content={t("site.title")} />
    <meta property="og:description" content={t("site.desc")} />
    <meta property="og:url" content={pageUrl} />
    <meta property="og:image" content={ogCard} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content={t("shot.alt")} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={t("site.title")} />
    <meta name="twitter:description" content={t("site.desc")} />
    <meta name="twitter:image" content={ogCard} />
    <meta name="twitter:image:alt" content={t("shot.alt")} />

    {@html `<script type="application/ld+json">${appJsonLd}</script>`}
</svelte:head>

<!--
    ── 动效约定（整页只有两种，全是 CSS，零 JS）──────────────────
      · 首屏之内：rise-in，按时间播，animation-delay 错开
      · 首屏之外：data-reveal，滚动驱动，--i 错开同一行
    两条都在 app.css 里，各自的边界条件写在那边。

    下载按钮和首屏 CTA 永不参与入场：这是下载站，转化路径上不该有任何一帧
    是看不见的。
-->

<!-- ========== Hero ========== -->
<!--
    这一层**不能**有 overflow-hidden：截图的翻转由 view() 滚动时间线驱动，
    而时间线量的是最近的滚动容器 —— overflow:hidden 本身就构成滚动容器，
    套在外面进度就永远不动了（见 app.css 的 shot-flip）。
    isolate 让背景那层 -z-10 停在本区块的层叠上下文里，不会沉到 body 底色下面。
-->
<section class="section-x relative isolate">
    <!-- 背景：一道极淡的顶光，静态渐变，不做任何动画。-top-16 让它延伸到顶栏底下，否则顶栏那 64px 会是一条色差 -->
    <div
        class="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[48rem] bg-[radial-gradient(60%_55%_at_50%_0%,var(--color-brand-100),transparent)]"
        aria-hidden="true"
    ></div>

    <div class="container-page flex flex-col items-center gap-4xl sm:gap-5xl">
        <div class="flex flex-col items-center gap-xl text-center sm:gap-2xl">
            <!--
                徽标：有比正式版新的测试版时报测试版（下载按钮仍然指正式版），
                否则报正式版的更新说明。测试版号由构建期同步，见 sync-release.mjs。
            -->
            <a
                href="{REPO_URL}/releases/tag/{PREVIEW ? PREVIEW.tag : `v${LATEST_VERSION}`}"
                target="_blank"
                rel="noopener noreferrer"
                class="rise-in group inline-flex max-w-full items-center gap-xs rounded-full border border-line bg-white/70 py-1 pr-3 pl-1 text-xs font-medium text-slate-600 shadow-xs backdrop-blur transition-colors hover:border-line-strong hover:text-slate-900"
            >
                <span
                    class="shrink-0 rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white"
                    >NEW</span
                >
                <span class="truncate">
                    {PREVIEW
                        ? t("hero.preview", {
                              version: `v${PREVIEW.version.replace(/-.*/, "")}`,
                          })
                        : t("hero.released", { version: LATEST_VERSION })}
                </span>
                <Icon
                    name="arrow"
                    size={12}
                    cls="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                />
            </a>

            <!-- 标题 + 副标题是一组，彼此靠得比与外部更近 -->
            <div class="flex flex-col items-center gap-md sm:gap-lg">
                <h1
                    class="rise-in text-[2.5rem]/[1.08] font-semibold tracking-[-0.035em] text-balance text-slate-900 [animation-delay:60ms] sm:text-6xl/[1.05] lg:text-7xl/[1.02]"
                >
                    {t("hero.title1")}
                    <code class="font-mono text-[0.82em] tracking-[-0.04em] text-brand-600"
                        >{t("hero.titleCode")}</code
                    >
                    {t("hero.title2")}
                </h1>
                <p
                    class="rise-in max-w-[36rem] text-base/relaxed text-pretty text-slate-500 [animation-delay:120ms] sm:text-lg/relaxed"
                >
                    {t("hero.sub")}
                </p>
            </div>

            <!-- 首屏 CTA：不挂 rise-in，首帧即可见可点 -->
            <div class="cluster-cta w-full">
                <a
                    href="#download"
                    class="flex min-h-12 w-full items-center justify-center gap-xs rounded-full bg-ink-900 px-7 font-semibold text-white shadow-sm transition-colors hover:bg-ink-800 sm:w-auto"
                >
                    <Icon name="download" size={18} />
                    {t("hero.cta")}
                </a>
                <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex min-h-12 w-full items-center justify-center gap-xs rounded-full border border-line bg-white px-7 font-semibold text-slate-800 transition-colors hover:border-line-strong hover:bg-paper-100 sm:w-auto"
                >
                    <Icon name="github" size={18} />
                    {t("hero.cta2")}
                </a>
            </div>

            <!-- 官方桌面端入口 -->
            <p class="rise-in -mt-xs text-xs text-slate-500 [animation-delay:160ms] sm:-mt-sm">
                {t("hero.alsoOfficialPrompt")}
                <a
                    href={OFFICIAL_DESKTOP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline"
                >
                    {t("hero.alsoOfficialLink")}
                    <Icon name="external" size={11} />
                </a>
            </p>

            <!--
                数字条。三格等宽 + 发丝线分隔，不套卡片 —— 首屏已经有一张截图做主角，
                这里只是一行「量级」的证据，越轻越好。
            -->
            <dl
                class="rise-in grid w-full max-w-[34rem] [animation-delay:200ms]"
                style="grid-template-columns: repeat({stats.length}, minmax(0, 1fr))"
            >
                {#each stats as s, i (s.label)}
                    <div
                        class="flex flex-col-reverse items-center gap-2xs px-xs {i
                            ? 'border-l border-line'
                            : ''}"
                        title={s.title}
                    >
                        <dt class="text-xs text-slate-500 sm:text-sm">{s.label}</dt>
                        <dd
                            class="nums-tabular text-xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
                        >
                            {s.value}
                        </dd>
                    </div>
                {/each}
            </dl>
        </div>

        <!--
            产品截图。外层 .shot-stage 负责 perspective 和滚动时间线，内层才是被旋转的
            对象 —— 透视必须挂在父级，挂自己身上 rotateX 出不来立体感。
            翻转整条在 CSS 里（app.css 的 shot-flip）：截图就在首屏之内，首帧就该是倾斜的。
        -->
        <div class="shot-stage w-full">
            <div
                data-shot
                class="overflow-hidden rounded-xl border border-line bg-white elev-3 sm:rounded-2xl"
            >
                <!--
                    源图是 1360x900 的 PNG。这是 LCP 元素，所以：
                    - avif / webp 两级现代格式，PNG 只作兜底（现代浏览器不会去取它）
                    - 680w 变体给窄屏：移动端渲染宽度约 372px，即使 DPR 2 也只要
                      744 设备像素，直接下 1360w 是四倍多的无用像素
                    预加载见 <head> 里那条 preload，srcset/sizes 与这里共用同一组常量。
                -->
                <picture>
                    <source
                        type="image/avif"
                        srcset={shotAvifSrcset}
                        sizes={SHOT_SIZES}
                    />
                    <source
                        type="image/webp"
                        srcset="{shotBase}-sm.webp 680w, {shotBase}.webp 1360w"
                        sizes={SHOT_SIZES}
                    />
                    <img
                        src="{shotBase}.png"
                        alt={t("shot.alt")}
                        width="1360"
                        height="900"
                        loading="eager"
                        fetchpriority="high"
                        class="block w-full"
                    />
                </picture>
            </div>
        </div>
    </div>
</section>

<!-- ========== 特性 ========== -->
<!--
    一整块发丝线网格：父层 bg-line + gap-px，格子自己是白底，缝就是线。
    比六张各带投影的卡片安静得多 —— 首页只让截图和下载卡有「高度」。
    入场挂在格子**里面**的内容上，不挂格子本身：格子一透明，底下的 bg-line
    就露出来，会闪一整块灰。
    圆角用 overflow-clip 裁，不用 overflow-hidden：后者会构成滚动容器，
    里面的 data-reveal 就去量它、永远停在 opacity 0（见 app.css）。
-->
<section id="features" class="section-x scroll-mt-20">
    <div class="container-page stack-section">
        <div data-reveal class="stack-heading">
            <h2 class="heading-2">{t("feat.heading")}</h2>
            <p class="lede">{t("feat.sub")}</p>
        </div>

        <div
            class="grid gap-px overflow-clip rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3"
        >
            {#each features as f, i (f.title)}
                <div class="bg-white p-xl sm:p-2xl">
                    <div
                        data-reveal
                        style="--i: {i % 3}"
                        class="flex flex-col gap-lg"
                    >
                        <Icon name={f.icon} size={22} cls="text-brand-600" />
                        <div class="stack-tight">
                            <h3 class="font-semibold text-slate-900">{t(f.title)}</h3>
                            <p class="text-sm/relaxed text-pretty text-slate-500">
                                {t(f.body)}
                            </p>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- ========== 手机连接 ========== -->
<section id="phone" class="section-x scroll-mt-20">
    <div
        class="container-page grid items-center gap-4xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6xl"
    >
        <div data-reveal class="flex flex-col items-start gap-2xl">
            <div class="stack-heading">
                <span
                    class="inline-flex w-fit items-center gap-2xs rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100"
                >
                    <Icon name="phone" size={13} />
                    {t(PHONE_STABLE ? "phone.badgeNew" : "phone.badge")}
                </span>
                <h2 class="heading-2">{t("phone.heading")}</h2>
                <p class="lede">{t("phone.sub")}</p>
            </div>
            <div class="flex flex-wrap items-center gap-sm">
                <a
                    href="{home}go/"
                    class="flex min-h-11 items-center gap-xs rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
                >
                    {t("phone.cta")}
                    <Icon name="arrow" size={15} />
                </a>
                <a
                    href="{home}docs/phone-connection/"
                    class="flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-paper-200 hover:text-slate-900"
                >
                    {t("phone.docs")}
                </a>
            </div>
        </div>

        <ul class="card divide-y divide-line">
            {#each channels as c, i (c.title)}
                <li data-reveal style="--i: {i}" class="flex items-start gap-md p-lg sm:p-xl">
                    <span
                        class="grid size-10 shrink-0 place-items-center rounded-full bg-paper-200 text-slate-700"
                    >
                        <Icon name={c.icon} size={18} />
                    </span>
                    <div class="stack-tight">
                        <h3 class="font-semibold text-slate-900">{t(c.title)}</h3>
                        <p class="text-sm/relaxed text-slate-500">{t(c.body)}</p>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</section>

<!-- ========== 插件 ========== -->
<section id="plugins" class="section-x scroll-mt-20">
    <div class="container-page stack-section">
        <div data-reveal class="stack-heading">
            <h2 class="heading-2">{t("plug.heading")}</h2>
            <p class="lede">{t("plug.sub")}</p>
        </div>

        <div class="grid gap-3xl lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-5xl">
            <ul class="flex flex-col divide-y divide-line border-y border-line">
                {#each plugins as p, i (p.title)}
                    <li data-reveal style="--i: {i}" class="flex gap-md py-xl">
                        <Icon name={p.icon} size={20} cls="mt-0.5 shrink-0 text-brand-600" />
                        <div class="stack-tight">
                            <h3 class="font-semibold text-slate-900">{t(p.title)}</h3>
                            <p class="text-sm/relaxed text-pretty text-slate-500">{t(p.body)}</p>
                        </div>
                    </li>
                {/each}
            </ul>

            <!-- DSH Market：全页唯一一块深色面，给「生态」一个明确的落点 -->
            <a
                data-reveal
                href={MARKET_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="group flex flex-col justify-between gap-4xl rounded-3xl bg-ink-900 p-2xl text-white transition-colors hover:bg-ink-800 sm:p-3xl"
            >
                <span
                    class="inline-flex w-fit items-center gap-2xs rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80"
                >
                    <Icon name="store" size={13} />
                    {t("plug.market.badge")}
                </span>
                <span class="flex flex-col gap-sm">
                    <span class="text-2xl font-semibold tracking-tight">{t("plug.market.title")}</span>
                    <span class="text-sm/relaxed text-pretty text-white/60">{t("plug.market.desc")}</span>
                    <span class="mt-md inline-flex items-center gap-xs text-sm font-semibold">
                        {t("plug.market.cta")}
                        <Icon
                            name="arrow"
                            size={15}
                            cls="transition-transform group-hover:translate-x-0.5"
                        />
                    </span>
                </span>
            </a>
        </div>
    </div>
</section>

<!-- ========== 下载 ========== -->
<Download />

<!-- ========== 结束 CTA ========== -->
<section class="section-x">
    <div
        class="container-page flex flex-col items-center gap-2xl border-t border-line pt-6xl text-center"
    >
        <div data-reveal class="flex flex-col items-center gap-md">
            <h2 class="heading-2">{t("cta.heading")}</h2>
            <p class="lede">{t("cta.sub")}</p>
        </div>

        <div class="cluster-cta w-full">
            <a
                href="#download"
                class="flex min-h-12 w-full items-center justify-center gap-xs rounded-full bg-ink-900 px-7 font-semibold text-white shadow-sm transition-colors hover:bg-ink-800 sm:w-auto"
            >
                <Icon name="download" size={18} />
                {t("cta.button")}
            </a>
            <a
                href={UPSTREAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="flex min-h-12 w-full items-center justify-center gap-xs rounded-full px-6 font-semibold text-slate-700 transition-colors hover:bg-paper-200 hover:text-slate-900 sm:w-auto"
            >
                {t("foot.upstream")}
                <Icon name="external" size={15} />
            </a>
        </div>

        <p class="text-xs text-slate-500">
            {t("cta.alsoOfficialPrompt")}
            <a
                href={OFFICIAL_DESKTOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline"
            >
                {t("cta.alsoOfficialLink")}
                <Icon name="external" size={11} />
            </a>
        </p>

        <p class="max-w-[40rem] text-xs/relaxed text-pretty text-slate-400">
            <strong class="font-semibold text-slate-600">{t("foot.disclaimerTitle")}</strong>
            · {t("foot.disclaimer")}
        </p>
    </div>
</section>
