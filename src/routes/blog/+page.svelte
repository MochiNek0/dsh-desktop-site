<script lang="ts">
	import { ORIGIN } from '$lib/site';

	let { data } = $props();

	const url = `${ORIGIN}/blog/`;
	const title = '博客 · dsh desktop';
	const desc = '关于 dsh desktop 与这个站点本身的一些记录：性能、构建、踩过的坑。';

	/** 2026-09-06 → 2026 年 9 月 6 日 */
	function human(date: string): string {
		const [y, m, d] = date.split('-');
		return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href={url} />

	<!--
		博客只有中文一份，所以这里**不写** hreflang alternate。
		hreflang 要求每个版本都列出全部版本，只有一个版本时整组标注没有意义，
		硬写一条指向自己反而会和首页那组产生歧义。
	-->
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="dsh desktop" />
	<meta property="og:locale" content="zh_CN" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={desc} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={`${ORIGIN}/og.png`} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<section class="section-x">
	<div class="container-page stack-section">
		<div class="stack-heading">
			<h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">博客</h1>
			<p class="text-base/relaxed text-pretty text-slate-600">{desc}</p>
		</div>

		<!-- 列表用 ul 而不是一堆 div：对读屏器来说「共 N 篇」是有用的信息 -->
		<ul class="flex flex-col gap-xl">
			{#each data.posts as post (post.slug)}
				<li>
					<a href={`/blog/${post.slug}/`} class="card card-hover group flex flex-col gap-sm p-xl">
						<time datetime={post.date} class="font-mono text-xs text-slate-400">
							{human(post.date)}
						</time>
						<h2
							class="text-lg font-semibold text-slate-900 transition-colors group-hover:text-brand-700"
						>
							{post.title}
						</h2>
						<p class="text-sm/relaxed text-pretty text-slate-600">{post.description}</p>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>
