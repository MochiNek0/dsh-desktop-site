---
title: 让动效给首屏让路
description: 一次桌面端性能排查：CLS 0.107、约 1 秒强制重排、LCP 元素渲染延迟 2 秒，最后发现是同一个根因。
date: '2026-09-06'
---

这个站上线之后我用 Chrome DevTools 的性能面板扫了一遍桌面端，拿到三个数字：

- **CLS 0.107**，其中 0.106 全落在一个元素上 —— 首屏那团背景光斑；
- **强制同步重排约 1.1 秒**，分散在好几个 chunk 里；
- **LCP 2.7 秒**，拆开看更刺眼：资源加载只花了 290ms，**元素渲染延迟却有 2030ms**。

三条看着像三个毛病，其实是一个。

## LCP 的四段拆解

LCP 值得先说清楚，因为它是唯一一个能直接告诉你「问题在哪一段」的指标。DevTools 会把它拆成四段：

| 子部分 | 我的数字 |
| --- | --- |
| 第一字节时间 | 0ms |
| 资源加载延迟 | 410ms |
| 资源加载时长 | 290ms |
| **元素渲染延迟** | **2030ms** |

前三段加起来 700ms，说明服务器和网络都没问题：那张预览图 700ms 就已经躺在内存里、解码完了。然后浏览器花了 **2 秒**才把它画出来。

图片早就准备好了却画不出来，只有一种可能：主线程在忙别的。

## 忙的是装饰

翻了一下，忙的全是装饰性的东西，而且它们都挂在同一个时机上 —— `onMount` 和 `$effect`，也就是水合一结束就开跑：

- GSAP 加上 ScrollTrigger 的初始化，要量一遍页面上所有触发器的位置；
- SplitText 把标题按行拆成一堆 span，每拆一次都要读一次布局；
- 安装提示那几块命令，被逐字符拆成几百个 span 做打字机效果。

这些代码本身没写错，读几何属性也是它们该做的事。问题在于**时机**：它们全部排在 LCP 那一帧前面。DevTools 里那 1.1 秒强制重排，和 2030ms 的渲染延迟，是同一段时间的两种记法。

结论很朴素：**装饰性的 JS 一律等首屏画完再跑。**

## 一个两级的门

于是有了这么一个小函数：

```ts
export function afterFirstPaint(run: () => void): () => void {
	let cancelled = false;

	const boot = () => {
		if (cancelled) return;
		if ('requestIdleCallback' in window) {
			requestIdleCallback(() => !cancelled && run(), { timeout: 500 });
		} else {
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
```

两级等待各有各的理由。`load` 保证 LCP 那张图已经下完、解码完，后面的活再重也压不到它前面；再让一步等 `requestIdleCallback`，是为了不和 `load` 前后的收尾工作挤在同一帧。

`timeout: 500` 是兜底，但**不能设大**。特性区有个 pin 效果，初始化时会往文档里插一个 pin-spacer、改变整页高度。要是拖到用户已经滚下去才插进来，就从「省掉一次重排」变成「制造一次真实的跳动」了 —— 那是把一个看不见的指标问题，换成一个看得见的体验问题。

## 剩下的 0.106

渲染延迟解决了，CLS 还挂在那团光斑上。奇怪的是：页面上还有一张截图，同样被 GSAP 每帧写 transform，它的分数是 **0.000**。

差别在一行代码。`motion.ts` 里给截图设了：

```ts
gsap.set(shot, { transformOrigin: 'center top', willChange: 'transform' });
```

光斑没设。

这就是判据：**transform 位移只有在合成器上跑才不算布局偏移**。元素没被提升成合成层，每帧的 transform 就是主线程上的一次重绘，浏览器老老实实把它记成布局偏移 —— 一个纯装饰的元素，因此吃掉了 0.106 分。

既然位移本来就该交给合成器，那还留着 ScrollTrigger 的 scrub 干什么？直接换成 CSS 滚动驱动动画：

```css
@utility blob-scene {
	view-timeline-name: --blob-scene;
}

@utility blob-drift {
	animation: blob-drift linear both;
	animation-timeline: --blob-scene;
	will-change: translate;
}

@keyframes blob-drift {
	to {
		translate: 0 var(--drift, -30%);
	}
}
```

进度来自滚动位置而不是时间，整条动画在合成器上跑，JS 一行都不用。顺手把鼠标视差也删了 —— 那是每次 `pointermove` 都要写一次 transform 的东西，收益和成本完全不成比例。

## 两个坑

**一、时间线要挂在 section 上，不能在光斑自己身上写 `view()`。**

这些区块都带 `overflow-hidden`，而 `overflow: hidden` 本身就是一个滚动容器。光斑写 `view()` 的话，量的是一个永远不会滚动的盒子，动画自然一动不动。正确做法是在 section 上具名 `view-timeline-name`，后代用 `animation-timeline` 引用。

**二、别写 `animation-range: entry 0% exit 100%`。**

我写了，然后在构建产物里发现它被 lightningcss 压成了 `animation-range: entry exit 0%` —— 那是另一个意思。默认的 `normal` 本来就等价于 `cover 0%` 到 `cover 100%`，也就是「区块前缘刚进视口」到「区块完全离开视口」，跟原来 ScrollTrigger 的 `top bottom` → `bottom top` 是同一段区间。不写这行就对了。

顺带一提：`prefers-reduced-motion` 里那条 `animation-duration: 0.001ms !important` 对滚动驱动动画**完全无效**，因为它的进度不来自时间。要单独写 `animation: none`。

## 留下的两条规矩

1. 装饰性 JS 一律等首屏画完再跑。
2. 每帧位移的元素必须是合成层，优先用 CSS 滚动驱动动画而不是 JS scrub。

第二条还有个附带好处：一旦位移由 CSS 承担，它就不再依赖 JS 加载成功。脚本挂了，页面也只是不动，不会停在一个 `opacity: 0` 的中间态上。
