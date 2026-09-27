<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { htmlLang, i18n, LANGS, pathForLang } from '$lib/i18n.svelte';
	import { ORIGIN } from '$lib/site';

	let { data } = $props();

	const t = $derived(i18n.t);
	const base = $derived(`${pathForLang(i18n.lang)}docs/`);
	const url = $derived(`${ORIGIN}${base}`);
	const title = $derived(`${t('docs.title')} · dsh desktop`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={t('docs.desc')} />
	<link rel="canonical" href={url} />
	<!-- 文档首页两种语言都有，hreflang 要双向列全，理由同首页 -->
	{#each LANGS as l (l)}
		<link rel="alternate" hreflang={htmlLang(l)} href="{ORIGIN}{pathForLang(l)}docs/" />
	{/each}
	<link rel="alternate" hreflang="x-default" href="{ORIGIN}/docs/" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="dsh desktop" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={t('docs.desc')} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content="{ORIGIN}{i18n.lang === 'zh' ? '/og.png' : '/og-en.png'}" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="stack-section">
	<div class="stack-heading">
		<h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t('docs.title')}</h1>
		<p class="text-base/relaxed text-pretty text-slate-600">{t('docs.desc')}</p>
	</div>

	<ul class="grid gap-md sm:grid-cols-2">
		{#each data.docs as doc (doc.slug)}
			<li>
				<a
					href="{base}{doc.slug}/"
					class="card card-hover group flex h-full flex-col gap-xs p-xl"
				>
					<span class="flex items-center justify-between gap-sm">
						<span class="font-semibold text-slate-900">{doc.title}</span>
						<Icon
							name="arrow"
							size={16}
							cls="shrink-0 text-slate-300 transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-slate-900"
						/>
					</span>
					<span class="text-sm/relaxed text-pretty text-slate-500">{doc.description}</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
