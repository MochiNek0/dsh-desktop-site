<script lang="ts">
    import { i18n, pathForLang } from "$lib/i18n.svelte";
    import { REPO_URL, UPSTREAM_URL } from "$lib/releases";
    import Icon from "./Icon.svelte";
    import Logo from "./Logo.svelte";

    const t = $derived(i18n.t);
    const year = new Date().getFullYear();

    /*
        站内锚点带上当前语言的首页路径，理由同 Header：
        Footer 也在根 layout 里，会跟着渲染到 /404 上，
        裸锚点在那一页指向不存在的区块（预渲染会直接报错）。
    */
    const home = $derived(pathForLang(i18n.lang));

    const cols = $derived([
        {
            title: t("foot.product"),
            links: [
                {
                    label: t("nav.download"),
                    href: `${home}#download`,
                    external: false,
                },
                {
                    label: t("nav.features"),
                    href: `${home}#features`,
                    external: false,
                },
                {
                    label: t("nav.plugins"),
                    href: `${home}#plugins`,
                    external: false,
                },
                { label: t("nav.faq"), href: `${home}#faq`, external: false },
            ],
        },
        {
            title: t("foot.resources"),
            links: [
                /*
                    博客只有中文一份，英文页不放入口 ——
                    把英文读者送进一整页中文，比没有这个入口更差。
                */
                ...(i18n.lang === "zh"
                    ? [{ label: t("nav.blog"), href: "/blog/", external: false }]
                    : []),
                { label: t("foot.repo"), href: REPO_URL, external: true },
                {
                    label: t("foot.releases"),
                    href: `${REPO_URL}/releases`,
                    external: true,
                },
                {
                    label: t("foot.readme"),
                    href: `${REPO_URL}#readme`,
                    external: true,
                },
                {
                    label: t("foot.issues"),
                    href: `${REPO_URL}/issues`,
                    external: true,
                },
            ],
        },
        {
            title: t("foot.about"),
            links: [
                {
                    label: t("foot.upstream"),
                    href: UPSTREAM_URL,
                    external: true,
                },
                {
                    label: t("foot.license"),
                    href: `${REPO_URL}/blob/main/LICENSE`,
                    external: true,
                },
            ],
        },
    ]);
</script>

<footer class="section-x border-t border-line bg-white">
    <div class="container-page flex flex-col gap-4xl">
        <div
            class="grid gap-3xl sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]"
        >
            <div class="flex flex-col gap-md">
                <div class="flex items-center gap-sm">
                    <Logo size={30} />
                    <span class="font-semibold tracking-tight text-slate-900">
                        dsh <span class="text-slate-400">desktop</span>
                    </span>
                </div>
                <p class="text-sm/6 text-slate-500">
                    {t("foot.disclaimer")}
                </p>
            </div>

            {#each cols as col (col.title)}
                <div class="flex flex-col gap-md">
                    <h3 class="text-sm font-semibold text-slate-900">
                        {col.title}
                    </h3>
                    <!-- 链接列表用 gap 代替 space-y，li 上不再挂边距 -->
                    <ul class="flex flex-col gap-sm">
                        {#each col.links as link (link.label)}
                            <li class="flex">
                                <a
                                    href={link.href}
                                    target={link.external
                                        ? "_blank"
                                        : undefined}
                                    rel={link.external
                                        ? "noopener noreferrer"
                                        : undefined}
                                    class="group inline-flex items-center gap-2xs text-sm text-slate-600 transition-colors hover:text-brand-700"
                                >
                                    {link.label}
                                    {#if link.external}
                                        <Icon
                                            name="external"
                                            size={12}
                                            cls="opacity-0 transition-opacity group-hover:opacity-60"
                                        />
                                    {/if}
                                </a>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>

        <div
            class="flex flex-col gap-sm border-t border-line pt-xl text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
        >
            <p>© {year} MochiNek0 · {t("foot.rights")}</p>
            <p>
                Built with <a
                    href="https://svelte.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-slate-600 underline decoration-dotted underline-offset-2 hover:text-brand-700"
                    >Svelte</a
                >
                · Deployed on
                <a
                    href="https://developers.cloudflare.com/workers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-slate-600 underline decoration-dotted underline-offset-2 hover:text-brand-700"
                    >Cloudflare</a
                >
            </p>
        </div>
    </div>
</footer>
