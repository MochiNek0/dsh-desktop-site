<script lang="ts">
	import { i18n } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		code: string;
	}

	let { code }: Props = $props();

	const t = $derived(i18n.t);

	let copied = $state(false);
	let failed = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => () => clearTimeout(timer));

	async function copy() {
		clearTimeout(timer);
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			failed = false;
		} catch {
			failed = true;
			copied = false;
		}
		timer = setTimeout(() => {
			copied = false;
			failed = false;
		}, 2000);
	}
</script>

<div class="group relative">
	<!--
		换行而不是横向滚动：这里放的是路径/命令，窄屏一定放不下
		（375px 下实测溢出 73px）。横向滚动等于把后半截藏起来 ——
		手机上既没有滚动条提示，块内横滑还和页面纵滑抢手势。
		pr-12 给右上角的复制按钮留一档，换行后每行都留，文字不会压在按钮下。
		同 InstallTips 的命令块，理由见那边的长注释。
	-->
	<pre
		class="rounded-xl border border-line bg-ink-900 px-4 py-3 pr-12 font-mono text-[13px]/relaxed whitespace-pre-wrap text-brand-200 [overflow-wrap:anywhere]"><code
			>{code}</code
		></pre>
	<button
		type="button"
		onclick={copy}
		class="absolute top-2 right-2 grid size-8 place-items-center rounded-lg bg-white/10 text-slate-300 opacity-100 transition-all hover:bg-white/20 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
		aria-label={copied ? t('dl.copied') : t('dl.copy')}
		title={failed ? t('dl.copyFail') : copied ? t('dl.copied') : t('dl.copy')}
	>
		<Icon name={copied ? 'check' : 'copy'} size={14} />
	</button>
</div>
