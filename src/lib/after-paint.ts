/**
 * 把一段工作推迟到首屏画完之后再跑。
 *
 * 存在的理由很具体：本站的装饰性动效（GSAP 初始化、SplitText 拆字、
 * InstallTips 把命令逐字拆成 span）加起来会做约 1 秒的**强制同步布局**。
 * 这些代码原本挂在 onMount / $effect 上，也就是水合一结束就开工 ——
 * 正好压在 LCP 那张截图的绘制前面：图片 700ms 就下完了，却要等主线程
 * 闲下来才画得出，DevTools 上「元素渲染延迟」2030ms 就是它。
 *
 * 两级等待：
 *   · load  —— 保证 LCP 资源已经下完解码完，后面的活再重也压不到它前面
 *   · idle  —— 再让一步，避免和 load 前后的收尾工作挤在同一帧
 *
 * timeout 500ms 是兜底。不能等太久：特性区那个 pin 会往文档里插
 * pin-spacer、改变页面高度，拖到用户已经滚下去才插进来，
 * 就从「省掉一次重排」变成「制造一次真实的跳动」了。
 *
 * @returns 取消函数；组件卸载时调用，避免回调打在已经销毁的 DOM 上
 */
export function afterFirstPaint(run: () => void): () => void {
	let cancelled = false;

	const boot = () => {
		if (cancelled) return;
		if ('requestIdleCallback' in window) {
			requestIdleCallback(() => !cancelled && run(), { timeout: 500 });
		} else {
			// Safari 18 之前没有 requestIdleCallback。已经过了 load，直接开工。
			run();
		}
	};

	if (document.readyState === 'complete') boot();
	else window.addEventListener('load', boot, { once: true });

	return () => {
		cancelled = true;
		window.removeEventListener('load', boot);
	};
}
