<script lang="ts">
	import { i18n } from '$lib/i18n.svelte';
	import { REPO_URL } from '$lib/releases';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';

	const t = $derived(i18n.t);

	let scrolled = $state(false);
	let mobileOpen = $state(false);

	const links = [
		{ href: '#features', key: 'nav.features' },
		{ href: '#download', key: 'nav.download' },
		{ href: '#plugins', key: 'nav.plugins' },
		{ href: '#faq', key: 'nav.faq' }
	];

	function onScroll() {
		scrolled = window.scrollY > 8;
	}

	function close() {
		mobileOpen = false;
	}
</script>

<svelte:window on:scroll={onScroll} />

<header
	class="fixed inset-x-0 top-0 z-50 transition-all duration-300
	{scrolled || mobileOpen
		? 'border-b border-line bg-white/85 backdrop-blur-xl'
		: 'border-b border-transparent'}"
>
	<div class="gutter-x container-page flex h-16 items-center justify-between gap-md">
		<!-- 品牌：用应用自己的鲸鱼图标 -->
		<a
			href="/"
			class="flex shrink-0 items-center gap-sm rounded-lg"
			onclick={close}
			aria-label="dsh desktop"
		>
			<Logo size={30} />
			<span class="font-semibold tracking-tight text-slate-900">
				dsh <span class="text-slate-400">desktop</span>
			</span>
		</a>

		<!-- 桌面导航 -->
		<nav class="hidden items-center gap-2xs md:flex" aria-label="Main">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-paper-200 hover:text-slate-900"
				>
					{t(link.key)}
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-2xs">
			<!-- 语言切换：按钮上显示的是「将切换到的目标语言」 -->
			<button
				type="button"
				onclick={() => i18n.toggle()}
				class="flex min-h-11 items-center gap-2xs rounded-lg px-2.5 text-sm text-slate-600 transition-colors hover:bg-paper-200 hover:text-slate-900"
				aria-label={t('nav.lang')}
				title={t('nav.lang')}
			>
				<Icon name="globe" size={16} />
				<span class="font-medium">{i18n.lang === 'zh' ? 'EN' : '中文'}</span>
			</button>

			<a
				href={REPO_URL}
				target="_blank"
				rel="noopener noreferrer"
				class="hidden min-h-11 min-w-11 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-paper-200 hover:text-slate-900 sm:grid"
				aria-label={t('nav.github')}
				title={t('nav.github')}
			>
				<Icon name="github" size={18} />
			</a>

			<a
				href="#download"
				class="hidden items-center gap-2xs rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ink-800 sm:flex"
			>
				<Icon name="download" size={15} />
				{t('nav.download')}
			</a>

			<!-- 移动端菜单开关 -->
			<button
				type="button"
				onclick={() => (mobileOpen = !mobileOpen)}
				class="grid size-11 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-paper-200 md:hidden"
				aria-label={t('nav.menu')}
				aria-expanded={mobileOpen}
				aria-controls="mobile-nav"
			>
				<Icon name={mobileOpen ? 'close' : 'menu'} size={20} />
			</button>
		</div>
	</div>

	{#if mobileOpen}
		<!--
			移动端面板：把桌面端隐藏掉的下载 CTA 也补进来，
			否则窄屏用户在顶栏里根本没有下载入口。
		-->
		<nav
			id="mobile-nav"
			class="gutter-x container-page border-t border-line pt-sm pb-md md:hidden"
			aria-label="Mobile"
		>
			<!--
				导航项之间几乎不留缝（靠 hover 底色分隔），
				但下载 CTA 是不同性质的操作，单独拆一层用 sm 间距推开。
			-->
			<div class="flex flex-col gap-sm">
				<div class="flex flex-col gap-2xs">
					{#each links as link (link.href)}
						<a
							href={link.href}
							onclick={close}
							class="flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-slate-700 transition-colors hover:bg-paper-200 hover:text-slate-900"
						>
							{t(link.key)}
						</a>
					{/each}

					<a
						href={REPO_URL}
						target="_blank"
						rel="noopener noreferrer"
						onclick={close}
						class="flex min-h-11 items-center gap-xs rounded-lg px-3 text-[15px] font-medium text-slate-700 transition-colors hover:bg-paper-200 hover:text-slate-900"
					>
						<Icon name="github" size={16} />
						{t('nav.github')}
					</a>
				</div>

				<a
					href="#download"
					onclick={close}
					class="flex min-h-11 items-center justify-center gap-xs rounded-xl bg-ink-900 px-4 font-semibold text-white transition-colors hover:bg-ink-800"
				>
					<Icon name="download" size={16} />
					{t('nav.download')}
				</a>
			</div>
		</nav>
	{/if}
</header>
