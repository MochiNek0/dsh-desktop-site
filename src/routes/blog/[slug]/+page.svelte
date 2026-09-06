<script lang="ts">
	import { ORIGIN } from '$lib/site';

	let { data } = $props();

	const Content = $derived(data.Content);
	const meta = $derived(data.meta);
	const url = $derived(`${ORIGIN}/blog/${data.slug}/`);

	/** 2026-09-06 → 2026 年 9 月 6 日 */
	const human = $derived.by(() => {
		const [y, m, d] = meta.date.split('-');
		return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
	});
</script>

<svelte:head>
	<title>{meta.title} · dsh desktop</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={url} />

	<!-- 中文单语，不写 hreflang alternate；理由见列表页 -->
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="dsh desktop" />
	<meta property="og:locale" content="zh_CN" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={`${ORIGIN}/og.png`} />
	<meta property="article:published_time" content={meta.date} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<section class="section-x">
	<article class="post">
		<header class="flex flex-col gap-sm">
			<time datetime={meta.date} class="font-mono text-xs text-slate-400">{human}</time>
			<h1 class="text-2xl font-bold tracking-tight text-balance text-slate-900 sm:text-3xl">
				{meta.title}
			</h1>
		</header>

		<div class="prose">
			<Content />
		</div>

		<a
			href="/blog/"
			class="inline-flex text-sm text-slate-500 transition-colors hover:text-brand-700"
		>
			← 返回博客
		</a>
	</article>
</section>

<!--
	正文排版全部写在这里，**不进 app.css**。

	两个原因叠在一起：svelte.config.js 的 inlineStyleThreshold 是按单个文件比的，
	首页那个 CSS 一旦超过阈值就静默退回外链、首屏多一趟往返；而 Tailwind v4 是
	单文件输出 —— 在这里用**新的** Tailwind 类同样会长进那个文件里去。
	所以这块用普通 CSS + 主题变量写，走 Svelte 作用域样式，只进 /blog 的路由 chunk。

	选择器都得套 :global：正文 HTML 是 mdsvex 编译出来的，
	带不上这个组件的作用域标记。
-->
<style>
	/*
		正文宽度单独定，不套 container-page —— 那个在 lg 下是 1240px，
		拿来排一行中文正文长得离谱。这里按可读行长收到 42rem。
	*/
	.post {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3xl);
		max-width: 42rem;
		margin-inline: auto;
	}

	.prose {
		color: var(--color-slate-700);
		line-height: 1.85;
		/* 长链接、长命令不许把版面撑破 */
		overflow-wrap: break-word;
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
	*/
	.prose :global(pre) {
		margin-block: 1.75em;
		padding: var(--spacing-md);
		border-radius: 12px;
		overflow-x: auto;
		font-size: 13px;
		line-height: 1.7;
		tab-size: 2;
	}

	.prose :global(pre code) {
		font-family: var(--font-mono);
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
		white-space: nowrap;
	}

	.prose :global(th) {
		color: var(--color-slate-900);
		font-weight: 600;
	}

	.prose :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 12px;
	}
</style>
