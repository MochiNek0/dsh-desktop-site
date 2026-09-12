/**
 * GSAP 动效层 —— 全站唯一的动画入口。
 *
 * 为什么集中到一个模块，而不是各组件里各写各的：
 *   1. 插件注册只能发生一次，且必须在浏览器端（SSR 时 window 不存在）
 *   2. reduced-motion 分支要统一，散落各处必然漏掉某一个
 *   3. ScrollTrigger 实例必须能整体销毁，否则语言切换/HMR 后会叠加
 *
 * ── 关键约束（改这个文件前务必读）──────────────────────────
 *
 * A. 不许用 CSS 预设 opacity:0 来做入场。
 *    本站是 adapter-static 预渲染的，HTML 一到就该是可读的。
 *    如果先用 CSS 藏起来再等 JS 放出来，JS 失败 / 被拦截 / 慢加载时
 *    用户会看到永久空白。所以初始状态一律由 gsap.set() 在 onMount
 *    同步写入 —— JS 没跑 = 内容原样可见，这是安全的降级方向。
 *    （app.css 里的 rise-in / shot-flip / blob-drift 不算破例：它们是纯 CSS
 *    动画，完全不依赖 JS —— 时间或滚动一到就自己走完并停在终态，
 *    风险模型完全不同。首屏截图的初始帧只能这么给，理由见下面那段说明。）
 *
 * B. 下载按钮和首屏 CTA 永不参与入场动画。
 *    这是下载站，转化路径上不该有任何一帧是不可点的。
 *
 * C. 每个效果都必须在 reduced-motion 分支里有对应处理。
 *    app.css 里那段 prefers-reduced-motion 只能压住 CSS 动画，
 *    **管不住 GSAP 写的行内样式** —— 必须在 JS 里显式分支。
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

let registered = false;

/** 幂等注册。gsap.registerPlugin 本身可重复调用，但没必要重复走。 */
function register() {
	if (registered || typeof window === 'undefined') return;
	gsap.registerPlugin(ScrollTrigger, SplitText);

	// 站点顶栏是 fixed h-16（64px），锚点滚动要避开它
	ScrollTrigger.config({ ignoreMobileResize: true });
	registered = true;
}

/** 统一缓动，和 app.css 里的 --ease-out-* 对齐 */
const EASE = 'expo.out';
const EASE_SOFT = 'power3.out';

export interface MotionHandle {
	destroy(): void;
}

export interface PageMotionHandle extends MotionHandle {
	/**
	 * 页面文案被整块换掉之后调用（本站只有切语言会这样）。
	 *
	 * 做两件事：把标题重新拆一遍（见 splitHeadings 的说明），
	 * 以及重算所有触发点 —— 中英文案长度不同，整页高度能差出几百 px，
	 * 而 ScrollTrigger 的 start/end 是创建时算死的、只在 resize 时重算，
	 * 语言切换不产生 resize。少了这一下，后面还没触发的区块
	 * （尤其是特性区那个 pin）会拿着旧坐标提前吸住。
	 */
	reflow(): void;
}

/**
 * 布局稳定后补一次触发点重算。
 *
 * ScrollTrigger 的 start/end 是**创建时按当时布局算死的**，之后只在
 * resize / 新建实例时重算。而本站有两个异步把页面顶高的因素：
 *   · Inter 变体字体到位后替换系统兜底字体，行高变化累积到整页
 *   · GSAP 走动态 import，触发器可能在 window load 之后才建起来
 *     （ScrollTrigger 自己只监听 DOMContentLoaded / load，晚于它注册就收不到）
 * 少了这次 refresh，靠后的区块会拿着旧坐标提前触发 ——
 * 表现就是「还没滚到，动画已经播完了」。
 */
function refreshWhenSettled(): () => void {
	const refresh = () => ScrollTrigger.refresh();

	if (document.fonts && document.fonts.status !== 'loaded') {
		document.fonts.ready.then(refresh);
	}

	if (document.readyState === 'complete') return () => {};
	window.addEventListener('load', refresh, { once: true });
	return () => window.removeEventListener('load', refresh);
}

/** 入场触发线：元素顶部进到视口 88% 处才开始 */
const REVEAL_RATIO = 0.88;
const REVEAL_START = `top ${REVEAL_RATIO * 100}%`;

/**
 * 从一组元素里挑出**还没越过入场触发线**的那些，也就是「用户还没看到的」。
 *
 * 两个地方要用，其实是同一件事的两面：
 *   · revealBatch 自己拿它筛掉已经看得见的元素（理由见下）
 *   · 需要自己额外写初始态的调用方（安装提示要先把命令拆成字符再藏起来）
 *     必须先知道哪些元素真的会参与入场，否则会把不参与动画的内容一起藏没
 */
export function belowRevealLine(items: HTMLElement[]): HTMLElement[] {
	const line = window.innerHeight * REVEAL_RATIO;
	return items.filter((el) => el.getBoundingClientRect().top > line);
}

/**
 * 一组元素的入场：**逐元素触发**，同一屏进来的才合批交错。
 *
 * 为什么不用「容器触发 + stagger」：容器比视口高的时候（窄屏的卡片列、
 * 2×2 的终端卡），容器顶部一露头整批就开跑，最下面几张在离视口还有
 * 一屏多的位置就已经播完 —— 用户滚到时看到的是静止的终态，白做。
 *
 * ScrollTrigger.batch 给每个元素各建一个触发器，再把 interval 内
 * 陆续进来的元素并成一批回调：同屏的仍然是「一组卡片依次浮起」，
 * 屏外的各等自己的时机。
 *
 * @param items    候选元素（各自独立触发）；调用时已在触发线以上的会被跳过，
 *                 保持静态可读 —— 见下面 belowRevealLine 那段说明
 * @param onReveal 该批入场结束后的回调，参数是这一批的元素
 */
export function revealBatch(
	items: HTMLElement[],
	onReveal?: (els: Element[]) => void
): MotionHandle {
	register();
	if (!items.length) return { destroy() {} };

	/*
		只给**还没进视口**的元素做入场。同 splitHeadings 的理由（见那里），
		外加一条更硬的：

		动效初始化排在首屏绘制之后，而手机上很容易在那之前就已经滚到半页 ——
		刷新和前进/后退会恢复上次的滚动位置，快速滑动也一样。对**创建时就
		已经越过 start 的**触发器，ScrollTrigger 在初始 refresh 里不会补发
		onEnter（那一轮的回调是被抑制的），于是下面 gsap.set 写进去的
		opacity:0 再没人还原 —— 用户滑到那里看到的是一片空白。

		安装提示区最容易撞上：它的命令还被拆成上百个字符 span 藏了起来，
		visibility:hidden 仍然占宽度，滑过去就是一块「有滚动条但什么都没有」
		的深色块。筛掉这些元素 = 它们保持预渲染的静态外观，永远不会空。
	*/
	const targets = belowRevealLine(items);
	if (!targets.length) return { destroy() {} };

	// 初始态由 JS 写入（约束 A）：JS 没跑 = 内容原样可见
	gsap.set(targets, { y: 26, opacity: 0 });

	const triggers = ScrollTrigger.batch(targets, {
		start: REVEAL_START,
		once: true,
		interval: 0.1,
		// 一批最多 4 个：再多就说明视口里挤了一屏卡片，
		// 继续攒下去尾部的延迟会长到看着像卡住
		batchMax: 4,
		onEnter: (batch) => {
			gsap.to(batch, {
				y: 0,
				opacity: 1,
				duration: 0.6,
				ease: EASE_SOFT,
				stagger: 0.08,
				clearProps: 'y',
				onComplete: onReveal ? () => onReveal(batch) : undefined
			});
		}
	});

	return {
		destroy() {
			triggers.forEach((t) => t.kill());
			gsap.set(targets, { clearProps: 'opacity,transform' });
		}
	};
}

/**
 * 标题逐字/逐行入场（SplitText）。
 *
 * 抽成独立函数、并且返回一个能完整拆掉自己的句柄，是因为它**必须能重跑**：
 * SplitText 会把标题的 innerHTML 换成一堆 span，revert() 也只是把保存的
 * 原始字符串写回 innerHTML —— 两次都产生新节点。所以框架一旦整块重建标题
 * （切语言时 Svelte 就会这么做），旧的 split 和它的触发器就指向了一批
 * 脱离文档的节点：新标题不再有入场动画，旧触发器则留在 ScrollTrigger 里
 * 按 0 坐标参与每一次 refresh。两个问题都只能靠重跑解决。
 */
function splitHeadings(root: HTMLElement): MotionHandle {
	const splits: SplitText[] = [];
	const tweens: gsap.core.Tween[] = [];

	/*
		只处理**还没进视口**的标题。

		动效初始化被推迟到首屏绘制之后（见 +page.svelte 里的说明），
		这时首屏那几个标题用户已经看了一秒了 —— 再把它们藏起来重播一遍
		入场，看到的是「闪一下」，不是入场。首屏标题的入场改由
		app.css 的 rise-in 承担：纯 CSS，跟首屏一起播，不占主线程。

		顺带把最贵的一段开销一起省了：SplitText 拆字 + 逐行量测
		是整个初始化里最重的部分，跳过首屏这几个能少掉近一半。

		读写要分开：先把所有位置一次量完，再进入下面的拆字循环 ——
		querySelectorAll 之后边读 rect 边改 DOM 就是标准的强制重排。
		触发线取 85%，和下面 scrollTrigger 的 start 保持一致。
	*/
	const line = window.innerHeight * 0.85;
	const pending = Array.from(root.querySelectorAll<HTMLElement>('[data-split]')).filter(
		(node) => node.getBoundingClientRect().top > line
	);

	// 只对标记了 data-split 的标题做，避免把 FAQ 里的长段落也切碎
	pending.forEach((node) => {
		// SplitText 会重排 DOM。中文没有空格分词，按 chars 切才有意义；
		// 但纯 chars 会破坏换行，所以同时保留 lines 作为遮罩容器。
		//
		// ⚠️ 关键：不能切碎带 text-gradient 的元素。
		// 那个效果靠 background-clip:text 实现 —— 背景在父元素上，
		// 一旦把文字拆进子 span，子元素没有背景，字就变成透明的
		// （表现为一块空白）。所以用 aria-hidden 之外的办法：
		// 把这类元素整体当作一个"字"参与动画，不再往下拆。
		const split = new SplitText(node, {
			type: 'lines,chars',
			linesClass: 'split-line',
			// mask 让每行有一个 overflow:hidden 的父层，
			// 字才能从"行的下沿"升上来，而不是凭空浮现
			mask: 'lines',
			// 这些元素保持原样，不拆字
			ignore: '[data-nosplit]'
		});
		splits.push(split);

		// 参与动画的单元 = 拆出来的字 + 被跳过的整块元素
		const ignored = Array.from(node.querySelectorAll('[data-nosplit]'));
		const targets = [...split.chars, ...ignored];
		// 按在文档中的先后排序，交错顺序才自然
		targets.sort((a, b) =>
			a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
		);

		tweens.push(
			gsap.from(targets, {
				yPercent: 110,
				opacity: 0,
				duration: 0.8,
				ease: EASE,
				stagger: { each: 0.012, from: 'start' },
				scrollTrigger: {
					trigger: node,
					start: 'top 85%',
					once: true
				}
			})
		);
	});

	return {
		destroy() {
			// 触发器要显式 kill：once 的实例在触发前不会自己消失，
			// 留着就会带着一个已经脱离文档的 trigger 参与 refresh。
			tweens.forEach((t) => {
				t.scrollTrigger?.kill();
				t.kill();
			});
			// SplitText 必须显式还原，否则 DOM 里留着一堆碎片 span，
			// 屏幕阅读器会把一句话读成一个个字。
			splits.forEach((s) => s.revert());
		}
	};
}

/**
 * 挂载全站动效。
 *
 * @param root 页面根元素，所有查询都限定在它内部（避免命中 header/footer）
 * @returns 句柄；组件卸载时必须调用 destroy，文案整块变化后调用 reflow
 */
export function initMotion(root: HTMLElement): PageMotionHandle {
	register();

	// gsap.matchMedia 会在媒体查询变化时自动 revert 对应分支的所有动画，
	// 包括用户中途在系统设置里打开「减少动态效果」——这是手写 matchMedia
	// 很难做对的部分。
	const mm = gsap.matchMedia(root);

	// 只有 FULL 分支会填；reduced-motion 下标题本来就没有动画，保持 null
	let headings: MotionHandle | null = null;

	const FULL = '(prefers-reduced-motion: no-preference)';
	const REDUCED = '(prefers-reduced-motion: reduce)';

	/* ══════════════════════════════════════════════════════════
	   减少动态效果：不做任何位移/缩放/透明度动画。
	   什么都不设置 = 保持预渲染的静态外观，这本身就是正确结果。
	   ══════════════════════════════════════════════════════════ */
	mm.add(REDUCED, () => {
		// 显式清掉可能残留的行内样式（比如从 full 分支切过来时）
		gsap.set(root.querySelectorAll('[data-anim]'), { clearProps: 'all' });
	});

	/* ══════════════════════════════════════════════════════════
	   完整动效
	   ══════════════════════════════════════════════════════════ */
	mm.add(FULL, () => {
		const q = gsap.utils.selector(root);

		// ── 1. 标题逐字/逐行入场（SplitText）────────────────────
		headings = splitHeadings(root);

		/*
			首屏截图的 3D 翻转和背景光斑视差都不在这里了 ——
			见 app.css 的 shot-flip / .blob-drift，两者都改成了 CSS 滚动驱动。

			光斑是为了 CLS：它原来是 scrub + pointermove 两条主线程逐帧写
			transform 的通道，而 Chrome 只把「合成器上的位移」排除在 layout shift
			之外 —— hero 那个 70rem 宽、130px 模糊的光斑一个人就吃掉了 0.106 的
			CLS。换成滚动驱动动画后位移整条跑在合成器上，CLS 归零。

			截图是为了**首帧**：它的进度取自滚动位置，而它在桌面和手机上都落在
			首屏之内 —— 页面刚画出来时就该已经倾斜到区间中段了。而这套初始化
			被推迟到 LCP 之后（见 after-paint.ts），JS 无论怎么写都只能在首帧
			之后才写得进变换：用户必然先看到一张端正的截图，几百毫秒后它才被
			压成倾斜态。那一下「跳」不是 JS 哪里写错了，是时机上追不上首帧 ——
			只有把初始帧交给静态 CSS 才追得上。

			这里留一段是为了防止有人「顺手把它们加回 JS 里」：
			加回来的第一天就会把这两个问题一起带回来。
		*/

		// ── 2. 卡片入场：轻微上浮 + 交错 ────────────────────────
		// 触发器挂在每张卡自己身上，不是挂在组容器上 —— 组容器往往
		// 比视口高，一个触发器带整组会让下半部分在屏外就播完。
		const reveals: MotionHandle[] = [];
		q('[data-stagger]').forEach((group) => {
			const items = Array.from(
				(group as HTMLElement).querySelectorAll<HTMLElement>(':scope > *')
			);
			reveals.push(revealBatch(items));
		});

		// ── 3. 进度条 ───────────────────────────────────────────
		q('[data-bar]').forEach((el) => {
			const node = el as HTMLElement;
			const pct = Number(node.dataset.bar) || 0;
			gsap.fromTo(
				node,
				{ scaleX: 0 },
				{
					scaleX: pct / 100,
					duration: 1.4,
					ease: EASE,
					transformOrigin: 'left center',
					scrollTrigger: { trigger: node, start: 'top 90%', once: true }
				}
			);
		});

		// ── 4. 下载区：卡片升起 → 工具栏滑入 → 版本行跟上 ───────
		//
		// 约束 B（下载按钮永不有不可点的帧）在这里的落法：
		// 大卡片**只做位移、不做透明度** —— 位移过程中按钮照样可见可点。
		// 只有工具栏（切换下载源）和底部版本行这类次要元素才用透明度。
		const dlCard = q('[data-dl-card]')[0] as HTMLElement | undefined;
		if (dlCard) {
			const bar = q('[data-dl-bar]');
			const meta = q('[data-dl-meta]');

			gsap.set(dlCard, { y: 32 });
			gsap.set([...bar, ...meta], { opacity: 0, y: 12 });

			gsap
				.timeline({
					scrollTrigger: { trigger: dlCard, start: 'top 85%', once: true }
				})
				.to(dlCard, { y: 0, duration: 0.9, ease: EASE, clearProps: 'transform' })
				.to(
					bar,
					{ opacity: 1, y: 0, duration: 0.5, ease: EASE_SOFT, clearProps: 'all' },
					0.22
				)
				.to(
					meta,
					{ opacity: 1, y: 0, duration: 0.5, ease: EASE_SOFT, clearProps: 'all' },
					0.36
				);
		}

		// ── 5. 插件区：左列逐条从左推入，右侧代码卡从右迎上 ─────
		//
		// 左右两组各自一个触发器，不合成一条 timeline：窄屏时两列会叠成
		// 上下两块、总高超过一屏，一个触发器带全组又会让下面那块在屏外播完。
		//
		// 横向位移一律 ≤ 16px：窄屏 section-x 的左右 padding 是 20px，
		// 再大就会探到 padding 外面去，动画期间冒出横向滚动条
		// （插件区没有自己的 overflow-hidden，兜不住）。
		const plugItems = q('[data-plug-item]') as HTMLElement[];
		if (plugItems.length) {
			gsap.set(plugItems, { opacity: 0, x: -16 });
			gsap.to(plugItems, {
				opacity: 1,
				x: 0,
				duration: 0.7,
				ease: EASE_SOFT,
				stagger: 0.12,
				clearProps: 'all',
				scrollTrigger: { trigger: plugItems[0], start: 'top 85%', once: true }
			});
		}

		const plugCard = q('[data-plug-card]')[0] as HTMLElement | undefined;
		if (plugCard) {
			gsap.set(plugCard, { opacity: 0, x: 16 });
			gsap.to(plugCard, {
				opacity: 1,
				x: 0,
				duration: 0.8,
				ease: EASE_SOFT,
				clearProps: 'all',
				scrollTrigger: { trigger: plugCard, start: 'top 85%', once: true }
			});
		}

		// matchMedia 的 cleanup：分支失效时自动调用
		return () => {
			reveals.forEach((r) => r.destroy());
			headings?.destroy();
			headings = null;
		};
	});

	const stopRefresh = refreshWhenSettled();

	return {
		reflow() {
			// 标题的 DOM 是新的，旧 split 连同它的触发器一起拆掉再重来
			if (headings) {
				headings.destroy();
				headings = splitHeadings(root);
			}
			// 新旧文案长度不同，整页高度跟着变，其余触发器的坐标也得重算
			ScrollTrigger.refresh();
		},
		destroy() {
			stopRefresh();
			mm.revert();
		}
	};
}

/**
 * 特性区：宽屏 pin + 卡片从右下角堆叠处展开成两行。
 *
 * 单独导出而不是塞进 initMotion：需要同时知道 pin 容器和网格两个元素，
 * 且只在宽屏启用 —— 窄屏 pin 会和浏览器的手势返回打架。
 *
 * ── 为什么偏移按「容器相对坐标」算 ─────────────────────────
 * 堆叠锚点 = 容器（= 整屏视口）右下角向内 32px。
 * 每张卡片的初始位移 = 锚点 − 卡片中心（都是容器相对值），
 * 布局稳定所以位移恒定：滚动接近时卡片一直"钉"在容器右下角，
 * pin 住后再逐张展开到各自位置，全程不漂移。
 * 全部走 transform，不改变布局，也不会产生横向滚动条。
 */
export function initPinnedStack(
	container: HTMLElement,
	grid: HTMLElement
): MotionHandle {
	register();

	const mm = gsap.matchMedia();

	mm.add(
		{
			// 只有「宽屏 + 允许动效」同时成立才 pin
			pinned: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'
		},
		(ctx) => {
			if (!ctx.conditions?.pinned) return;

			const cards = Array.from(grid.children) as HTMLElement[];
			if (!cards.length) return;

			// 每张卡片相对容器的位移：让卡片中心落在容器右下角的锚点上。
			// 全部用布局值（offsetLeft/offsetTop/offsetWidth/Height）：
			// 不受 transform / pin / 滚动影响，随时量都是当下的真实布局。
			// featViewport 带 relative，是卡片的 offsetParent，
			// 所以卡片相对容器的坐标 = offsetLeft + offsetWidth / 2。
			//
			// 接成 GSAP 的「函数式初值」而不是先算好一张表：函数式初值会在
			// invalidate 时重新求值，而 invalidateOnRefresh 的 invalidate 正好
			// 发生在 refresh 的「复位 pin → 重新量测」之后，量到的就是新布局。
			// （原来放在 onRefresh 里重算晚了一步：那个回调在 refreshAll 的最末尾
			// 才跑，本轮 invalidate 读到的仍是上一次的值 —— 窗口尺寸变过之后，
			// 卡片会按旧尺寸的锚点堆叠。）
			const stackOffset = (el: HTMLElement) => {
				const w = el.offsetWidth;
				const h = el.offsetHeight;
				return {
					x: container.offsetWidth - w / 2 - 32 - (el.offsetLeft + w / 2),
					y: container.offsetHeight - h / 2 - 32 - (el.offsetTop + h / 2)
				};
			};

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: container,
					// 顶栏 fixed 64px，紧贴它吸住：容器底正好落在视口底，
					// 右下角的堆叠块完整可见，不会探到视口外面去。
					start: 'top 64px',
					// 滚动距离 ≈ 3/4 屏高：展开从容，不拖沓
					end: () => '+=' + Math.round(window.innerHeight * 0.75),
					pin: true,
					scrub: 0.6,
					/*
						不用 anticipatePin。

						它的做法是拿当前滚动速度往前预判 45ms（源码里 anticipatePin *= 45），
						预判位置一旦越过 start，就把进度强行置成 0.0001 —— 也就是**提前把
						容器 fix 住**。容器一 fix 就贴到 top:64px，可它在文档里其实还差
						「速度 × 45ms」才滚到那儿，于是整块内容在那一帧向上跳这一段：
						标题是这一屏最先入眼的东西，跳的看起来就是它。快滚时这段能到
						100px 以上，慢滚时速度接近 0 完全看不出来 —— 正好是「有时候才跳」。

						这个选项是给滚动被代理/平滑化（ScrollSmoother、Lenis 之类）的场景
						补渲染延迟用的。本站是原生滚动，没有那份延迟要补，只剩副作用。
					*/
					invalidateOnRefresh: true,
					/*
						必须先于其它触发器 refresh。

						pin 会往文档里插一个 pin-spacer，把后面的内容整体推低
						约 0.75 屏。而 ScrollTrigger 默认**按创建顺序** refresh
						（源码里只有当任意实例带了 refreshPriority 时才会改按
						文档顺序排序），本站又是 initMotion 先建、这个 pin 后建 ——
						于是特性区之后的下载 / 安装提示 / 插件 / FAQ / 结束 CTA
						全都按"还没有 pin-spacer"的旧高度算触发点，提前约 0.75 屏
						触发：用户滑到标题时动画早播完了。

						给它一个高优先级，pin 先落位、其余再按文档顺序算。
					*/
					refreshPriority: 1
				}
			});

			tl.fromTo(
				cards,
				{
					x: (_i: number, el: HTMLElement) => stackOffset(el).x,
					y: (_i: number, el: HTMLElement) => stackOffset(el).y,
					// 每张一个轻微角度差，堆叠时露出下面几张的边，像一摞纸
					rotate: (i) => -3 + i * 1.2
				},
				{
					x: 0,
					y: 0,
					rotate: 0,
					duration: 0.9,
					ease: 'power3.out',
					stagger: 0.12,
					// 关键：创建 tween 时立刻应用「堆叠」初始态（否则页面加载时
					// 卡片停在最终位置，pin 触发后才跳到右下角，形成"跳变"）
					immediateRender: true
				}
			);

			return () => {
				tl.scrollTrigger?.kill();
				tl.kill();
				gsap.set(cards, { clearProps: 'transform' });
			};
		}
	);

	return {
		destroy() {
			mm.revert();
		}
	};
}
