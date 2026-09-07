<script lang="ts">
    /**
     * 站点累计访问人数。
     *
     * 口径是**人数**不是人次：按浏览器里的一个随机长期标识去重，
     * 同一个人来多少次都只算一个。取舍见 $lib/session 的 visitorId()。
     *
     * ── 为什么不是 WebSocket ────────────────────────────────
     * 这个数只增不减，而且没人会盯着它看跳动。一次请求拿到当前值就够了，
     * 为它维持一条长连接（还要处理重连、心跳超时、DO 计费）纯属浪费。
     *
     * ── 为什么在客户端取而不是预渲染 ────────────────────────
     * 站点是 adapter-static 预渲染的，HTML 在构建时就定死了。
     * 这个数必须是访问那一刻的值，只能在浏览器里拿。
     *
     * 取数本身在 $lib/visitors —— 那是个模块级单例，
     * 所以这个组件在一页里挂几次、SPA 导航重挂多少回，
     * 都只会有一次请求。
     */
    import { onMount } from "svelte";
    import { i18n } from "$lib/i18n.svelte";
    import { formatCount } from "$lib/releases";
    import { ensureVisitorCount, visitorCount } from "$lib/visitors.svelte";

    let {
        /**
         * 前置分隔符的样式，none 表示不要。
         *
         * 分隔符必须由本组件渲染：数字取不到时整块消失，
         * 放在外面会剩一个悬空的分隔符。
         *
         * 两种样式对应两种排版语言 ——
         * rule（竖线）是下载区那排 text-sm 元信息用的；
         * dot（·）是 Footer 底栏用的，那一行本来就以 · 分隔。
         */
        divider = "none",
    }: { divider?: "none" | "rule" | "dot" } = $props();

    const t = $derived(i18n.t);
    const total = $derived(visitorCount());
    const labelFirst = $derived(t("visitors.order") === "label-first");

    onMount(ensureVisitorCount);
</script>

{#if total !== null}
    {#if divider === "rule"}
        <span
            class="hidden h-3.5 w-px bg-line sm:block"
            aria-hidden="true"
        ></span>
    {:else if divider === "dot"}
        <span aria-hidden="true">·</span>
    {/if}
    <!--
        语序交给 i18n：中文读作「本站总共访问人数 3,289」，
        英文读作「3,289 visitors so far」。
        在组件里写 lang === 'zh' 的话，以后加第三种语言就得改代码。
    -->
    <span class="nums-tabular" title={t("visitors.note")}>
        {#if labelFirst}
            {t("visitors.label")}
            <span class="font-medium text-slate-700">{formatCount(total)}</span>
        {:else}
            <span class="font-medium text-slate-700">{formatCount(total)}</span>
            {t("visitors.label")}
        {/if}
    </span>
{/if}
