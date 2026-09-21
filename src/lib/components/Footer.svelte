<script lang="ts">
    import { i18n, pathForLang } from "$lib/i18n.svelte";
    import { MARKET_URL, REPO_URL, UPSTREAM_URL } from "$lib/releases";
    import Icon from "./Icon.svelte";
    import Logo from "./Logo.svelte";
    import VisitorCount from "./VisitorCount.svelte";

    const t = $derived(i18n.t);
    const year = new Date().getFullYear();

    interface FooterLink {
        label: string;
        href?: string;
        external?: boolean;
        copy?: string;
    }

    interface FooterCol {
        title: string;
        links: FooterLink[];
    }

    let copiedKey = $state<string | null>(null);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;

    async function copyText(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            copiedKey = text;
            clearTimeout(copyTimer);
            copyTimer = setTimeout(() => {
                copiedKey = null;
            }, 2000);
        } catch {
            // fallback
        }
    }

    /*
        门户链接带上当前语言的首页路径：Footer 在根 layout 里，
        /en/ 下这一条必须指向 /en/go/，而不是中文那一份。
    */
    const home = $derived(pathForLang(i18n.lang));

    const cols = $derived<FooterCol[]>([
        {
            title: t("foot.product"),
            links: [
                /*
                    这一列原来还有下载 / 特性 / 插件 / 常见问题四个 `#hash`，
                    和顶栏那几项一起去掉了：它们在首页上只是页内滚动，
                    区块之间的跳转由首屏承担，页脚只回答「去哪一页」。
                */
                { label: t("nav.connect"), href: `${home}go/`, external: false },
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
                { label: t("foot.market"), href: MARKET_URL, external: true },
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
                {
                    label: `${t("foot.group")}: 1125671315`,
                    copy: "1125671315",
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
                                {#if link.copy}
                                    <button
                                        type="button"
                                        onclick={() => link.copy && copyText(link.copy)}
                                        class="group inline-flex cursor-pointer items-center gap-2xs text-left text-sm text-slate-600 transition-colors hover:text-brand-700"
                                        title={t("foot.clickCopy")}
                                    >
                                        <span>{link.label}</span>
                                        {#if copiedKey === link.copy}
                                            <Icon name="check" size={12} cls="text-brand-600" />
                                        {:else}
                                            <Icon
                                                name="copy"
                                                size={12}
                                                cls="opacity-0 transition-opacity group-hover:opacity-60"
                                            />
                                        {/if}
                                    </button>
                                {:else}
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
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>

        <div
            class="flex flex-col gap-sm border-t border-line pt-xl text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
        >
            <!--
                访客数跟在版权后面：它和「Built with / Deployed on」一样
                是站点级元信息，不属于任何一节内容。

                Footer 在根 layout 里，所以这一处就覆盖了全站每一页 ——
                包括博客和 404。取数是模块级单例，SPA 导航不会重复请求。
            -->
            <p class="flex flex-wrap items-center gap-x-sm gap-y-2xs">
                <span>© {year} MochiNek0 · {t("foot.rights")}</span>
                <VisitorCount divider="dot" />
            </p>
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
