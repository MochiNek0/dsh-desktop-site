/**
 * 站点 Worker。
 *
 * 只做一件事：收下载点击信标。其余请求原样交回静态资源。
 *
 * ── 为什么是信标而不是 /dl/ 跳转统计 ────────────────────────
 * 下载按钮必须直连镜像。把 Worker 塞进下载的必经之路，等于给这个站
 * 唯一必须能用的功能加一个新的失效点 —— Worker 挂了下载就全断。
 * 而且 /dl/ 这种链接会被爬虫和浏览器预取踩，数字会虚高。
 * 信标发丢只是少记一次，下载不受任何影响。代价是会少数（关 JS、
 * 拦截器），所以这个数天生是低估的一侧，这比虚高好解释。
 */

/** wrangler 用 esbuild 打包本文件、不做类型检查，所以这里自带最小声明，
 *  不引 @cloudflare/workers-types，也就不需要 wrangler types 生成 d.ts。 */
interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
}

interface D1Result {
	results?: Record<string, unknown>[];
}
interface D1Statement {
	bind(...values: unknown[]): D1Statement;
	run(): Promise<unknown>;
	all(): Promise<D1Result>;
}
interface D1Database {
	prepare(sql: string): D1Statement;
}
interface Env {
	ASSETS: { fetch(request: Request): Promise<Response> };
	DB: D1Database;
	/** /api/daily 的读取口令，wrangler secret put STATS_TOKEN */
	STATS_TOKEN?: string;
}

/** 必须和 src/lib/releases.ts 里的 MirrorId 一致 */
const MIRROR_IDS = new Set(['ghproxy', 'ghproxycom', 'ghfast', 'llkk', 'direct']);

/** 资产名形如 dsh-desktop_0.1.10_x64-setup.exe */
const FILE_RE = /^[A-Za-z0-9._-]{1,120}$/;
/** 客户端每次会话生成的 16 位十六进制 */
const SID_RE = /^[0-9a-f]{16}$/;
/**
 * 来源标记：?from= 的值，或 referrer 的主机名。
 *
 * 这里没法像 mirror 那样用固定白名单 —— 新平台随时会加，
 * 改一次 Worker 才能记一个新来源不现实。所以退而求其次：
 * 限定字符集并封顶长度，保证这个公开端点存不进任意字符串。
 */
const SRC_RE = /^[a-z0-9._-]{1,32}$/;

const NO_CONTENT = { status: 204 } as const;

/**
 * 记一次下载点击。
 *
 * 这是个公开可写的端点，所以三个字段全部白名单校验，
 * 并且要求同源 Origin —— 挡不住铁了心的人，但足够挡掉顺手的脚本。
 * 真被刷了就在 Cloudflare 上加一条按 IP 的 Rate Limiting 规则。
 */
async function handleClick(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	if (request.method !== 'POST') return new Response(null, { status: 405 });

	const origin = request.headers.get('origin');
	if (origin && new URL(origin).host !== new URL(request.url).host) {
		return new Response(null, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(null, { status: 400 });
	}

	const { sid, file, mirror, src } = (body ?? {}) as Record<string, unknown>;
	if (
		typeof sid !== 'string' ||
		!SID_RE.test(sid) ||
		typeof file !== 'string' ||
		!FILE_RE.test(file) ||
		typeof mirror !== 'string' ||
		!MIRROR_IDS.has(mirror)
	) {
		return new Response(null, { status: 400 });
	}

	/*
		src 是可选的，而且**不合法就丢掉、不拒绝整条**：
		来源只是运营信息，下载点击本身才是要保住的数据。
		为一个畸形的 ?from= 把整次点击记成 400，就本末倒置了。
	*/
	const source = typeof src === 'string' && SRC_RE.test(src) ? src : null;

	/*
		waitUntil：写库不能挡住响应。用户这时候正要跳去下载，
		多等一个 D1 往返毫无意义。写失败就吞掉 —— 统计再重要也
		排在「不打扰下载」后面。
	*/
	ctx.waitUntil(
		env.DB.prepare('INSERT INTO clicks (ts, sid, file, mirror, src) VALUES (?, ?, ?, ?, ?)')
			.bind(Math.floor(Date.now() / 1000), sid, file, mirror, source)
			.run()
			.catch((err: unknown) => console.error('[click] 写入失败', err))
	);

	return new Response(null, NO_CONTENT);
}

/**
 * 给每日汇总脚本读的聚合端点。
 *
 * 做成 Worker 端点而不是让 CI 直连 D1，是为了少一份凭据：
 * CI 只需要一个 STATS_TOKEN，不需要 Cloudflare API Token、
 * account id 和 database id 三件套。
 */
async function handleDaily(request: Request, env: Env): Promise<Response> {
	if (!env.STATS_TOKEN) return new Response('STATS_TOKEN 未配置', { status: 503 });
	if (request.headers.get('authorization') !== `Bearer ${env.STATS_TOKEN}`) {
		return new Response(null, { status: 401 });
	}

	const url = new URL(request.url);
	const from = Number(url.searchParams.get('from'));
	const to = Number(url.searchParams.get('to'));
	if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from >= to) {
		return new Response('from/to 必须是 unix 秒且 from < to', { status: 400 });
	}

	/*
		两个口径，故意不同 ——

		distinct：同一次会话里为同一个文件点了多个镜像（第一个镜像挂了
		换下一个），真实只发生了一次下载，必须收敛成 1。这是「不要重复」
		的主要来源。

		byMirror 用原始计数：它是拿去从 GitHub 增量里减的，而每一次
		透传镜像的点击都可能在 GitHub 那边 +1，所以减得多一点更安全 ——
		宁可少算总量，不可虚报。

		bySrc 跟 distinct 同口径（去重），因为它要回答的是「这个平台带来了
		几次下载」。用原始计数的话，换过镜像的人会被算成两次，
		平台之间就没法横向比了。
	*/
	const [distinct, byMirror, bySrc] = await Promise.all([
		env.DB.prepare(
			"SELECT COUNT(DISTINCT sid || '|' || file) AS n FROM clicks WHERE ts >= ? AND ts < ?"
		)
			.bind(from, to)
			.all(),
		env.DB.prepare(
			'SELECT mirror, COUNT(*) AS n FROM clicks WHERE ts >= ? AND ts < ? GROUP BY mirror'
		)
			.bind(from, to)
			.all(),
		// COALESCE 在 SQL 里收掉 NULL：否则 JS 侧 String(null) 会变成 "null" 这个键
		env.DB.prepare(
			"SELECT COALESCE(src, 'unknown') AS src, COUNT(DISTINCT sid || '|' || file) AS n" +
				' FROM clicks WHERE ts >= ? AND ts < ? GROUP BY 1'
		)
			.bind(from, to)
			.all()
	]);

	return Response.json({
		from,
		to,
		distinct: Number(distinct.results?.[0]?.n ?? 0),
		byMirror: Object.fromEntries(
			(byMirror.results ?? []).map((r) => [String(r.mirror), Number(r.n)])
		),
		bySrc: Object.fromEntries((bySrc.results ?? []).map((r) => [String(r.src), Number(r.n)]))
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname === '/api/click') return handleClick(request, env, ctx);
		if (pathname === '/api/daily') return handleDaily(request, env);
		// 其余一律交回静态资源；未命中时由 not_found_handling 出 404.html
		return env.ASSETS.fetch(request);
	}
};
