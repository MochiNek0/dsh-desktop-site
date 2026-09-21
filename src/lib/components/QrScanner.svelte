<script lang="ts">
	/**
	 * 全屏取景器：读一张二维码，把里面的文本交回去。
	 *
	 * 这一页能开相机，靠的是它自己在 HTTPS 上 —— `getUserMedia` 要 secure context，
	 * 而桌面网关那条局域网明文 HTTP 的路走不到这里。这也正是门户存在的理由之一。
	 *
	 * 解码器（jsQR）是**动态 import** 的：它只在有人真的按下扫码时才下载，
	 * 首页和这一页的首屏都不为它付钱。
	 */
	import { i18n } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		onfound: (text: string) => void;
		oncancel: () => void;
	}

	let { onfound, oncancel }: Props = $props();

	const t = $derived(i18n.t);

	let video: HTMLVideoElement;
	let failed = $state(false);

	let stream: MediaStream | null = null;
	let frame = 0;
	let stopped = false;

	/*
		解码分辨率上限。取景是满屏的，但解码不需要 —— 1080p 的一帧喂给 jsQR
		在手机上要几十毫秒，逐帧跑会把取景画面本身拖卡。640 足够读出一张
		占据画面三分之一的二维码。
	*/
	const LIMIT = 640;

	/** 每秒最多解码 10 次。相机本来也没有更快的东西可给。 */
	const INTERVAL = 100;

	$effect(() => {
		void start();
		return stop;
	});

	async function start() {
		try {
			const [jsQR, media] = await Promise.all([
				import('jsqr').then((m) => m.default),
				navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
			]);

			// 等待期间用户可能已经取消了，那就把刚拿到的摄像头立刻还回去。
			if (stopped) {
				media.getTracks().forEach((track) => track.stop());
				return;
			}

			stream = media;
			video.srcObject = media;
			await video.play();

			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d', { willReadFrequently: true });
			if (!ctx) {
				failed = true;
				return;
			}

			let last = 0;
			const tick = (now: number) => {
				if (stopped) return;
				frame = requestAnimationFrame(tick);

				if (now - last < INTERVAL) return;
				last = now;
				if (video.readyState < video.HAVE_CURRENT_DATA) return;

				const scale = Math.min(1, LIMIT / Math.max(video.videoWidth, video.videoHeight));
				canvas.width = Math.round(video.videoWidth * scale);
				canvas.height = Math.round(video.videoHeight * scale);
				if (!canvas.width || !canvas.height) return;

				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
				// 桌面卡片上的码是深色印在浅色上，不必再试一遍反相 —— 省一半解码时间。
				const found = jsQR(image.data, image.width, image.height, {
					inversionAttempts: 'dontInvert'
				});

				if (found?.data) {
					stop();
					onfound(found.data);
				}
			};

			frame = requestAnimationFrame(tick);
		} catch {
			// 拒绝授权、没有摄像头、非 secure context —— 对用户来说是同一件事：
			// 这条路走不通，去用手输那条。
			failed = true;
		}
	}

	function stop() {
		stopped = true;
		cancelAnimationFrame(frame);
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
	}
</script>

<svelte:window on:keydown={(e) => e.key === 'Escape' && oncancel()} />

<div class="fixed inset-0 z-[60] flex flex-col bg-ink-950">
	<div class="relative flex-1 overflow-hidden">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={video}
			class="size-full object-cover {failed ? 'invisible' : ''}"
			playsinline
			muted
			autoplay
		></video>

		{#if failed}
			<div class="absolute inset-0 grid place-items-center px-lg text-center">
				<div class="flex flex-col items-center gap-sm">
					<Icon name="info" size={28} cls="text-white/70" />
					<p class="font-medium text-white">{t('go.scan.failed')}</p>
					<p class="max-w-[20rem] text-sm/relaxed text-white/60">{t('go.scan.failedHint')}</p>
				</div>
			</div>
		{:else}
			<!--
				取景框。它不裁剪解码区域（整帧都在解），纯粹是告诉人往哪儿对 ——
				真去裁的话，稍微偏一点的码就扫不出来，而用户不会知道为什么。
			-->
			<div class="pointer-events-none absolute inset-0 grid place-items-center">
				<div class="size-60 rounded-3xl border-2 border-white/80 shadow-[0_0_0_100vmax_rgb(0_0_0/0.45)]"></div>
			</div>
			<p
				class="absolute inset-x-0 bottom-6 px-lg text-center text-sm text-white/80 drop-shadow"
			>
				{t('go.scan.hint')}
			</p>
		{/if}
	</div>

	<div class="flex justify-center p-lg pb-[max(20px,env(safe-area-inset-bottom))]">
		<button
			type="button"
			onclick={oncancel}
			class="flex min-h-11 items-center gap-xs rounded-xl bg-white/10 px-5 font-medium text-white transition-colors hover:bg-white/20"
		>
			<Icon name="close" size={16} />
			{t('go.scan.cancel')}
		</button>
	</div>
</div>
