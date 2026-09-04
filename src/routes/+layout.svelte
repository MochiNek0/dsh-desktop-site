<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { i18n } from '$lib/i18n.svelte';

	let { children } = $props();

	// 客户端挂载后读取语言偏好（预渲染产物固定为中文，避免 hydration 不匹配）
	$effect(() => {
		i18n.init();
	});
</script>

<div class="flex min-h-dvh flex-col">
	<Header />
	<main class="flex-1 pt-16">
		{@render children()}
	</main>
	<Footer />
</div>
