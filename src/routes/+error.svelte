<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { i18n } from '$lib/i18n.svelte';

	const t = $derived(i18n.t);
</script>

<svelte:head>
	<title>{t('nf.title')} · dsh desktop</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="section-x grid min-h-[70vh] place-items-center text-center">
	<div class="container-page flex flex-col items-center gap-2xl">
		<div class="stack-heading">
			<p class="font-mono text-6xl font-bold text-gradient sm:text-7xl">
				{page.status}
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
				{t('nf.title')}
			</h1>
			<p class="text-slate-600">{t('nf.body')}</p>
		</div>
		<a
			href="/"
			class="inline-flex min-h-12 items-center gap-xs rounded-xl bg-ink-900 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-ink-800"
		>
			<Icon name="arrow" size={16} />
			{t('nf.home')}
		</a>
	</div>
</section>
