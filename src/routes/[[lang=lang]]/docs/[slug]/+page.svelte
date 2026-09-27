<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { htmlLang, i18n, pathForLang } from '$lib/i18n.svelte';
	import { ORIGIN } from '$lib/site';

	let { data } = $props();

	const t = $derived(i18n.t);
	const Content = $derived(data.Content);
	const index = $derived(data.docs.findIndex((d) => d.slug === data.slug));
	const meta = $derived(data.docs[index]);
	const prev = $derived(index > 0 ? data.docs[index - 1] : null);
	const next = $derived(data.docs[index + 1] ?? null);

	const base = $derived(`${pathForLang(i18n.lang)}docs/`);
	const url = $derived(`${ORIGIN}${base}${data.slug}/`);

	/*
		给正文里的每个代码块挂一个复制按钮。

		按钮是 append 进 <pre> 里面的，不去给 <pre> 外面再包一层：
		正文节点归 Svelte 管，把它挪进新的父元素，组件卸载时按兄弟节点区间删 DOM
		就可能删不干净。塞在 <pre> 里面，删 <pre> 时按钮跟着一起走。
		也因此代码块不做横向滚动（见下面 style 里的 pre），否则按钮会跟着内容一起被滑走。
	*/
	function copyButtons(node: HTMLElement) {
		const timers: ReturnType<typeof setTimeout>[] = [];

		node.querySelectorAll('pre').forEach((pre) => {
			const code = pre.querySelector('code');
			if (!code) return;

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'copy';
			btn.textContent = t('docs.copy');
			btn.addEventListener('click', async () => {
				try {
					await navigator.clipboard.writeText(code.innerText.trimEnd());
					btn.textContent = t('docs.copied');
				} catch {
					btn.textContent = t('docs.copyFail');
				}
				timers.push(setTimeout(() => (btn.textContent = t('docs.copy')), 2000));
			});
			pre.append(btn);
		});

		return { destroy: () => timers.forEach(clearTimeout) };
	}
</script>

<svelte:head>
	<title>{meta.title} · dsh desktop</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={url} />
	<!--
		hreflang 只列这一篇**真实存在**的语言版本（见 $lib/docs 的 langsOf）。
		只有一种语言时整组不写：单个版本的 hreflang 没有意义。
	-->
	{#if data.langs.length > 1}
		{#each data.langs as l (l)}
			<link rel="alternate" hreflang={htmlLang(l)} href="{ORIGIN}{pathForLang(l)}docs/{data.slug}/" />
		{/each}
		<link rel="alternate" hreflang="x-default" href="{ORIGIN}/docs/{data.slug}/" />
	{/if}
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="dsh desktop" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content="{ORIGIN}{i18n.lang === 'zh' ? '/og.png' : '/og-en.png'}" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<article class="doc">
	<header class="stack-heading">
		<h1 class="text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-4xl">
			{meta.title}
		</h1>
		<p class="text-base/relaxed text-pretty text-slate-500">{meta.description}</p>
	</header>

	<!-- 换篇时整块重建，复制按钮才会挂到新正文上 -->
	{#key Content}
		<div class="prose" use:copyButtons>
			<Content />
		</div>
	{/key}

	<nav class="grid gap-md border-t border-line pt-2xl sm:grid-cols-2" aria-label={t('docs.title')}>
		{#if prev}
			<a href="{base}{prev.slug}/" class="group flex flex-col gap-2xs rounded-xl p-md transition-colors hover:bg-paper-200">
				<span class="flex items-center gap-2xs text-xs text-slate-400">
					<Icon name="arrow" size={12} cls="rotate-180" />{t('docs.prev')}
				</span>
				<span class="font-medium text-slate-900">{prev.title}</span>
			</a>
		{:else}
			<span></span>
		{/if}
		{#if next}
			<a href="{base}{next.slug}/" class="group flex flex-col items-end gap-2xs rounded-xl p-md text-right transition-colors hover:bg-paper-200">
				<span class="flex items-center gap-2xs text-xs text-slate-400">
					{t('docs.next')}<Icon name="arrow" size={12} />
				</span>
				<span class="font-medium text-slate-900">{next.title}</span>
			</a>
		{/if}
	</nav>
</article>

<!--
	正文排版全部写在这里，**不进 app.css**。

	两个原因叠在一起：svelte.config.js 的 inlineStyleThreshold 是按单个文件比的，
	首页那个 CSS 一旦超过阈值就静默退回外链、首屏多一趟往返；而 Tailwind v4 是
	单文件输出 —— 在这里用**新的** Tailwind 类同样会长进那个文件里去。
	所以这块用普通 CSS + 主题变量写，走 Svelte 作用域样式，只进文档的路由 chunk。

	选择器都得套 :global：正文 HTML 是 mdsvex 编译出来的，
	带不上这个组件的作用域标记。
-->
<style>
	/* 正文按可读行长收窄，不跟着 container-page 的 1240px 走 */
	.doc {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3xl);
		max-width: 44rem;
	}

	.prose {
		color: var(--color-slate-700);
		line-height: 1.85;
		/* 长链接、长命令不许把版面撑破 */
		overflow-wrap: break-word;
	}

	.prose > :global(:first-child) {
		margin-top: 0;
	}

	/* 段落间距用 em，跟着字号走 */
	.prose :global(p) {
		margin-block: 1.25em;
	}

	.prose :global(h2),
	.prose :global(h3) {
		color: var(--color-slate-900);
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.4;
		/* 上大下小：标题跟它后面的正文是一组，跟上一段不是 */
		margin-block: 2.4em 0.8em;
	}

	.prose :global(h2) {
		font-size: 1.375rem;
	}

	.prose :global(h3) {
		font-size: 1.0625rem;
	}

	.prose :global(a) {
		color: var(--color-brand-700);
		text-decoration: underline;
		text-decoration-color: var(--color-brand-200);
		text-underline-offset: 3px;
		transition: text-decoration-color 0.2s ease;
	}

	.prose :global(a:hover) {
		text-decoration-color: currentColor;
	}

	.prose :global(strong) {
		color: var(--color-slate-900);
		font-weight: 600;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin-block: 1.25em;
		padding-inline-start: 1.4em;
	}

	.prose :global(ul) {
		list-style: disc;
	}

	.prose :global(ol) {
		list-style: decimal;
	}

	.prose :global(li) {
		margin-block: 0.5em;
	}

	.prose :global(li::marker) {
		color: var(--color-slate-400);
	}

	/*
		只挑行内代码。不加 :not(pre) 的话这条会盖到代码块里的 <code> 上，
		把 shiki 的配色连同背景一起顶掉。
	*/
	.prose :global(:not(pre) > code) {
		font-family: var(--font-mono);
		font-size: 0.875em;
		background: var(--color-paper-200);
		border-radius: 6px;
		padding: 0.15em 0.4em;
		color: var(--color-slate-800);
	}

	/*
		代码块的底色和字色由 shiki 在构建期写成 inline style
		（主题 github-dark，底色换成了本站的 ink-900），这里只管盒子。

		换行而不是横向滚动：这里几乎全是要复制的命令，窄屏一定放不下，
		横滑等于把后半截藏起来。右侧 padding 给复制按钮留一档。
	*/
	.prose :global(pre) {
		position: relative;
		margin-block: 1.5em;
		padding: var(--spacing-md) 5.5rem var(--spacing-md) var(--spacing-md);
		border-radius: 12px;
		font-size: 13px;
		line-height: 1.7;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.prose :global(pre code) {
		font-family: var(--font-mono);
	}

	.prose :global(pre .copy) {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 4px 10px;
		border-radius: 8px;
		font-family: var(--font-sans);
		font-size: 12px;
		line-height: 1.5;
		color: var(--color-slate-300);
		background: rgb(255 255 255 / 0.08);
		transition: background-color 0.2s ease, color 0.2s ease;
	}

	.prose :global(pre .copy:hover) {
		color: #fff;
		background: rgb(255 255 255 / 0.16);
	}

	.prose :global(blockquote) {
		margin-block: 1.5em;
		padding-inline-start: var(--spacing-md);
		border-inline-start: 3px solid var(--color-brand-200);
		color: var(--color-slate-500);
	}

	.prose :global(hr) {
		margin-block: 3em;
		border: 0;
		border-top: 1px solid var(--color-line);
	}

	/*
		display: block + overflow-x 让宽表格自己横向滚，
		而不是把整页撑出一条横向滚动条。
	*/
	.prose :global(table) {
		display: block;
		overflow-x: auto;
		margin-block: 1.75em;
		border-collapse: collapse;
		font-size: 0.9375rem;
	}

	.prose :global(th),
	.prose :global(td) {
		padding: 0.6em 0.9em;
		border-bottom: 1px solid var(--color-line);
		text-align: start;
	}

	.prose :global(th) {
		color: var(--color-slate-900);
		font-weight: 600;
		white-space: nowrap;
	}

	.prose :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 12px;
	}
</style>
