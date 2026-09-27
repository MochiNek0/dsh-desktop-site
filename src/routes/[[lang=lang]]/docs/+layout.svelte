<script lang="ts">
	import { page } from '$app/state';
	import { i18n, pathForLang } from '$lib/i18n.svelte';

	let { data, children } = $props();

	const t = $derived(i18n.t);
	const base = $derived(`${pathForLang(i18n.lang)}docs/`);
	const current = $derived(page.params.slug);
</script>

<section class="section-x">
	<div class="container-page grid gap-3xl lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-6xl">
		<!--
			宽屏：左侧常驻目录，sticky 跟着正文走。
			窄屏：同一份目录折成一排可换行的胶囊放在正文上面 ——
			不做横向滚动，理由同 InstallTips 旧版的命令块：手机上横滑既没有提示，
			又和页面纵滑抢手势。文档首页本身就是一张目录，那里不再重复一遍。
		-->
		<nav
			aria-label={t('docs.title')}
			class="lg:sticky lg:top-24 lg:self-start {current ? '' : 'max-lg:hidden'}"
		>
			<a
				href={base}
				class="mb-sm hidden text-xs font-semibold tracking-wide text-slate-400 uppercase transition-colors hover:text-slate-700 lg:block"
			>
				{t('docs.title')}
			</a>
			<ul class="flex flex-wrap gap-xs lg:flex-col lg:gap-2xs">
				{#each data.docs as doc (doc.slug)}
					{@const active = doc.slug === current}
					<li>
						<a
							href="{base}{doc.slug}/"
							aria-current={active ? 'page' : undefined}
							class="flex min-h-9 items-center rounded-full border px-3 text-sm transition-colors lg:rounded-lg lg:border-0 lg:px-3
							{active
								? 'border-ink-900 bg-ink-900 font-medium text-white lg:bg-paper-200 lg:text-slate-900'
								: 'border-line bg-white text-slate-600 hover:text-slate-900 lg:bg-transparent lg:hover:bg-paper-200'}"
						>
							{doc.title}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="min-w-0">
			{@render children()}
		</div>
	</div>
</section>
