<script lang="ts">
	import Icon from './Icon.svelte';

	// 预渲染的 /404 传 404；+error.svelte 把真实状态码传进来。
	let { status = 404 }: { status?: number } = $props();
</script>

<!--
	刻意只用英文、也刻意不接 i18n：这一页不属于 [[lang]] 路由，拿不到语言参数，
	站点也不再用 localStorage 记语言 —— 无从判断该说哪种话。
	"404 / Not Found" 各语言用户都认得，比猜错语言好。
-->
<section class="section-x grid min-h-[70vh] place-items-center text-center">
	<div class="container-page flex flex-col items-center gap-2xl">
		<div class="stack-heading">
			<p class="font-mono text-6xl font-bold text-gradient sm:text-7xl">{status}</p>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Not Found</h1>
		</div>
		<a
			href="/"
			class="inline-flex min-h-12 items-center gap-xs rounded-xl bg-ink-900 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-ink-800"
		>
			<Icon name="arrow" size={16} />
			Back to home
		</a>
	</div>
</section>
