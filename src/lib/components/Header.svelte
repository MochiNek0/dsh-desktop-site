<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { htmlLang, i18n, pathForLang } from '$lib/i18n.svelte';
	import { REPO_URL } from '$lib/releases';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';

	const t = $derived(i18n.t);

	// 切换器上显示的是「将要切到的语言」，所以到处用的都是这一个。
	const otherLang = $derived(i18n.lang === 'zh' ? 'en' : 'zh');

	/*
		语言切换落到**同一页**的另一种语言，而不是一律回首页。

		只有 [[lang]] 下的路由才有对应页面；其余（404）回对方首页。
		文档是个例外：允许只写一种语言，另一边不存在时退回对方的文档首页 ——
		这一篇有哪些语言由文档页的服务端 load 给出（page.data.langs）。
	*/
	const switchHref = $derived.by(() => {
		if (!page.route.id?.startsWith('/[[lang=lang]]')) return pathForLang(otherLang);
		const rest = page.url.pathname.replace(/^\/en(?=\/)/, '').slice(1);
		const langs = page.data.langs as string[] | undefined;
		if (langs && !langs.includes(otherLang)) return `${pathForLang(otherLang)}docs/`;
		return `${pathForLang(otherLang)}${rest}`;
	});

	/*
		导航里只放**真实页面**，区块之间的跳转交给首屏和页脚，顶栏只回答「去哪一页」。
		右侧那个「下载」按钮不是导航项，是这一站的主转化入口。
	*/
	const links = $derived([
		{ key: 'nav.docs', href: `${pathForLang(i18n.lang)}docs/` },
		{ key: 'nav.connect', href: `${pathForLang(i18n.lang)}go/` }
	]);

	const downloadHref = $derived(`${pathForLang(i18n.lang)}#download`);

	let scrolled = $state(false);
	let open = $state(false);
	let reduceMotion = $state(false);

	/** 菜单打开时不收成胶囊：全屏面板压在下面，顶栏要和它连成一片 */
	const pill = $derived(scrolled && !open);

	function onScroll() {
		scrolled = window.scrollY > 16;
	}

	function close() {
		open = false;
	}

	onMount(() => {
		// 刷新 / 返回时浏览器会恢复滚动位置，首帧就得是对的形态
		onScroll();

		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = reduce.matches;
		const onReduce = (e: MediaQueryListEvent) => (reduceMotion = e.matches);
		reduce.addEventListener('change', onReduce);

		// 窗口拉宽到出现桌面导航时，全屏面板没有意义了
		const wide = window.matchMedia('(min-width: 768px)');
		const onWide = (e: MediaQueryListEvent) => e.matches && close();
		wide.addEventListener('change', onWide);

		return () => {
			reduce.removeEventListener('change', onReduce);
			wide.removeEventListener('change', onWide);
		};
	});

	afterNavigate(close);

	/*
		全屏面板打开时锁住页面滚动，否则手指在面板上一划，下面的页面跟着走。
		写在 <html> 上而不是 body：app.css 把 overflow-x 挂在 html 上，
		滚动容器就是它。
	*/
	$effect(() => {
		if (!open) return;
		const root = document.documentElement;
		root.style.overflow = 'hidden';
		return () => (root.style.overflow = '');
	});

	/*
		Svelte 5 的过渡走 Web Animations API，app.css 里 reduced-motion 那条
		`animation-duration: 0.001ms !important` 管不到它 —— 必须自己分支。
	*/
	const ms = (n: number) => (reduceMotion ? 0 : n);
</script>

<svelte:window onscroll={onScroll} onkeydown={(e) => e.key === 'Escape' && close()} />

<header class="fixed inset-x-0 top-0 z-50" data-pill={pill ? '' : undefined}>
	<div class="gutter-x">
		<div class="bar container-page relative flex h-16 items-center justify-between gap-md">
			<!--
				胶囊底板。原理见下面 style 里的说明：它只变尺寸、不变起点，
				两侧内容靠 translate 往里收 —— 整个变形过程不产生布局位移。
			-->
			<div class="plate" aria-hidden="true"></div>

			<a
				href={pathForLang(i18n.lang)}
				class="start relative flex shrink-0 items-center gap-sm rounded-lg"
				onclick={close}
				aria-label="dsh desktop"
			>
				<Logo size={28} />
				<span class="font-semibold tracking-tight text-slate-900">
					dsh <span class="text-slate-400">desktop</span>
				</span>
			</a>

			<!-- 桌面导航：绝对居中，不跟两侧内容的宽度走 -->
			<nav
				class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2xs md:flex"
				aria-label="Main"
			>
				{#each links as link (link.href)}
					<a
						href={link.href}
						aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
						class="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 aria-[current]:text-slate-900"
					>
						{t(link.key)}
					</a>
				{/each}
			</nav>

			<div class="end relative flex items-center gap-2xs">
				<!-- 语言切换：按钮上显示的是「将切换到的目标语言」 -->
				<a
					href={switchHref}
					hreflang={htmlLang(otherLang)}
					class="flex min-h-10 items-center gap-2xs rounded-full px-2.5 text-sm text-slate-600 transition-colors hover:bg-paper-200 hover:text-slate-900"
					aria-label={t('nav.lang')}
					title={t('nav.lang')}
				>
					<Icon name="globe" size={16} />
					<span class="font-medium">{otherLang === 'en' ? 'EN' : '中文'}</span>
				</a>

				<a
					href={REPO_URL}
					target="_blank"
					rel="noopener noreferrer"
					class="hidden size-10 place-items-center rounded-full text-slate-600 transition-colors hover:bg-paper-200 hover:text-slate-900 sm:grid"
					aria-label={t('nav.github')}
					title={t('nav.github')}
				>
					<Icon name="github" size={18} />
				</a>

				<a
					href={downloadHref}
					class="hidden items-center gap-2xs rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink-800 sm:flex"
				>
					<Icon name="download" size={15} />
					{t('nav.download')}
				</a>

				<button
					type="button"
					onclick={() => (open = !open)}
					class="grid size-10 place-items-center rounded-full text-slate-800 transition-colors hover:bg-paper-200 md:hidden"
					aria-label={t('nav.menu')}
					aria-expanded={open}
					aria-controls="mobile-nav"
				>
					<Icon name={open ? 'close' : 'menu'} size={20} />
				</button>
			</div>
		</div>
	</div>
</header>

{#if open}
	<!--
		移动端全屏面板。压在顶栏下面（z-40 < z-50），顶栏在打开时退回透明的整条，
		和面板的底色连成一片 —— 看起来是「顶栏向下展开成了一整屏」。
		下载 CTA 放在底部拇指区：窄屏上顶栏里的下载按钮是隐藏的，这里是唯一入口。
	-->
	<div
		id="mobile-nav"
		class="fixed inset-0 z-40 flex flex-col bg-paper-100 pt-16 md:hidden"
		transition:fade={{ duration: ms(180) }}
	>
		<nav
			class="gutter-x flex flex-1 flex-col gap-3xl overflow-y-auto pt-2xl pb-[max(env(safe-area-inset-bottom),24px)]"
			aria-label="Mobile"
		>
			<ul class="flex flex-col">
				{#each [...links, { key: 'nav.github', href: REPO_URL }] as link, i (link.href)}
					{@const external = link.href === REPO_URL}
					<li in:fly={{ y: 12, duration: ms(420), delay: ms(40 + i * 45), opacity: 0 }}>
						<a
							href={link.href}
							target={external ? '_blank' : undefined}
							rel={external ? 'noopener noreferrer' : undefined}
							onclick={close}
							class="flex items-center justify-between gap-md border-b border-line py-lg text-2xl font-semibold tracking-tight text-slate-900"
						>
							{t(link.key)}
							<Icon name={external ? 'external' : 'arrow'} size={20} cls="text-slate-400" />
						</a>
					</li>
				{/each}
			</ul>

			<div class="mt-auto" in:fly={{ y: 12, duration: ms(420), delay: ms(200), opacity: 0 }}>
				<a
					href={downloadHref}
					onclick={close}
					class="flex min-h-14 items-center justify-center gap-xs rounded-full bg-ink-900 px-6 text-base font-semibold text-white transition-colors hover:bg-ink-800"
				>
					<Icon name="download" size={18} />
					{t('nav.download')}
				</a>
			</div>
		</nav>
	</div>
{/if}

<style>
	/*
		── 滚动后收成胶囊：只动尺寸和 transform，不动任何元素的起点 ──

		直觉写法是给整条顶栏换 max-width / padding —— 那是真实的布局变化，
		logo 和按钮的起点每帧都在挪，而滚动不算「用户输入」，
		这几百毫秒的位移会原样计进 CLS（本站的底线，见 app.css 光斑那段）。

		这里拆成两半：
		  · 底板 .plate 用 left:50% + translate(-50%) 居中，变形时只改 width/height。
		    起点（left/top）从头到尾不变，只改尺寸不算 layout shift；
		    它又是 absolute，改尺寸不会牵动任何兄弟节点重排。
		  · 两侧内容 .start / .end 用 translate 往里收，transform 从来不计进 CLS。
		    收多少由容器查询单位算出（.bar 是 inline-size 容器，100cqw 就是它的内容宽），
		    所以视口多宽都对得上，不用 JS 量。

		胶囊比内容宽 28px（两边各 14px 内衬）。收缩量 =（顶栏形态的底板宽 − 胶囊宽）/ 2，
		窄屏时胶囊宽度本来就撑满，这个量是 0，只剩上下收窄。
	*/
	.bar {
		container-type: inline-size;
		--pill: 52rem;
		--shift: max(0px, (100cqw + 28px - var(--pill)) / 2);
	}

	.plate {
		position: absolute;
		top: 50%;
		left: 50%;
		translate: -50% -50%;
		width: calc(100% + 28px);
		height: 100%;
		border: 1px solid transparent;
		border-radius: 9999px;
		transition:
			width 0.5s var(--ease-out-quint),
			height 0.5s var(--ease-out-quint),
			background-color 0.3s ease,
			border-color 0.3s ease,
			box-shadow 0.3s ease;
	}

	.start,
	.end {
		transition: translate 0.5s var(--ease-out-quint);
	}

	[data-pill] .plate {
		width: min(100% + 28px, var(--pill));
		height: 48px;
		background-color: rgb(255 255 255 / 0.78);
		border-color: var(--color-line);
		box-shadow:
			var(--edge-light),
			0 1px 2px rgb(51 51 51 / 0.04),
			0 12px 32px -12px rgb(51 51 51 / 0.14);
		-webkit-backdrop-filter: blur(16px) saturate(1.6);
		backdrop-filter: blur(16px) saturate(1.6);
	}

	[data-pill] .start {
		translate: var(--shift) 0;
	}

	[data-pill] .end {
		translate: calc(-1 * var(--shift)) 0;
	}
</style>
