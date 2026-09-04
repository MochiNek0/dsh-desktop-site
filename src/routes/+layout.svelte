<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { page } from '$app/state';
	import { htmlLang, i18n, langFromParam } from '$lib/i18n.svelte';

	let { children } = $props();

	/*
		语言必须在渲染出 HTML 之前就定下来，所以这里是**同步**读一次路由参数 ——
		$effect 在 SSR / 预渲染阶段根本不执行，只靠它的话
		/en/ 产出的静态 HTML 会是一整页中文，等于白拆这条路由。
	*/
	i18n.lang = langFromParam(page.params.lang);

	/*
		客户端跨语言导航时根 layout 实例不重建，上面那句不会再跑，所以补一个 effect。
		<html lang> 也要在这里跟上 —— 它是 hooks.server.ts 写进 HTML 的，
		走 SPA 导航时不会自己变。
	*/
	$effect(() => {
		const lang = langFromParam(page.params.lang);
		i18n.lang = lang;
		document.documentElement.lang = htmlLang(lang);
	});
</script>

<div class="flex min-h-dvh flex-col">
	<Header />
	<main class="flex-1 pt-16">
		{@render children()}
	</main>
	<Footer />
</div>
