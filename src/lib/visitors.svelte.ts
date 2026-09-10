/**
 * 站点累计访问人数 —— 全站共享的单例状态。
 *
 * 显示的是**人数**（按 localStorage 里的 vid 去重），
 * 不是人次：同一个人明天再来不会让数字 +1。
 *
 * ── 为什么是模块级单例，而不是组件内的 state ──────────────
 * 这个数要在 Footer（每一页都有）显示，还可能同时出现在下载区。
 * 如果取数逻辑写在组件里，就会出现两个问题：
 *
 *   1. 同一页面挂两个组件 = 发两次请求；
 *   2. SPA 站内导航（首页 → 博客）如果重挂了组件，又是一次请求。
 *
 * 服务端有 INSERT OR IGNORE 去重，所以上面这些**不会让数字虚高**，
 * 但每一次都是一趟白跑的 D1 往返。模块级单例把「这次页面加载
 * 只取一次」这件事在客户端就定死，服务端去重退化成第二道保险。
 *
 * ── 生命周期 ────────────────────────────────────────────
 * 模块状态活在整个 JS 运行时里，也就是「这个标签页从打开到关闭」。
 * 这正好和 sessionStorage 里 sid 的生命周期对齐 —— 两者要么一起在，
 * 要么一起没，不会出现「sid 还在但又报到了一次」的错位。
 */
import { sessionId, visitorId } from './session';

/**
 * 首屏占位数字。
 *
 * 预渲染 HTML 里拿不到真实访问量（那是访问那一刻的值），但也不该
 * 留一块空白等网络 —— 先亮一个固定数，真数到了再覆盖；接口挂了
 * （本地 vite dev 没有 Worker、生产端短暂故障）就一直用它。
 */
const PLACEHOLDER_TOTAL = 3289;

/** 当前展示值。初始即占位，不再用 null 表示「还没拿到」 */
let total = $state<number | null>(PLACEHOLDER_TOTAL);

/** 本次页面加载是否已经发过请求 —— 无论成功失败都不再发第二次 */
let requested = false;

/**
 * 取一次访客数（幂等）。
 *
 * 重复调用只有第一次真的发请求，后续直接返回。所以每个需要显示
 * 这个数字的组件都可以在 onMount 里无脑调它，不必互相协调。
 *
 * 失败也标记为已请求：统计端挂了就继续用占位数字，
 * 不值得为一行装饰性的元信息重试、更不该每次导航都重试一遍。
 */
export function ensureVisitorCount(): void {
	if (requested || typeof window === 'undefined') return;
	requested = true;

	/*
		两个标识都带上：
		  vid（localStorage，长期）→ 人数，也就是页面上显示的那个数
		  sid（sessionStorage，会话）→ 人次，只入库不展示

		隐私模式下两个都可能拿不到。那就带上拿得到的那个，
		一个都没有就纯读 —— Worker 对缺失的标识只读不写，
		这类访客看得到数字但不被计入。和下载统计同一个取舍：
		宁可少算，不可虚报。
	*/
	const q = new URLSearchParams();
	const vid = visitorId();
	const sid = sessionId();
	if (vid) q.set('vid', vid);
	if (sid) q.set('sid', sid);

	const qs = q.toString();
	const url = qs ? `/api/visit?${qs}` : '/api/visit';

	fetch(url)
		.then((r) => (r.ok ? r.json() : null))
		.then((data: unknown) => {
			const n = Number((data as { total?: unknown } | null)?.total);
			// 0 不覆盖占位：一个「0 次访问」比占位更糟
			if (Number.isFinite(n) && n > 0) total = n;
		})
		.catch(() => {
			// 统计端挂了继续显示占位，不留空白
		});
}

/** 当前访客数。初始是占位值，真数到了会被覆盖 */
export function visitorCount(): number | null {
	return total;
}
