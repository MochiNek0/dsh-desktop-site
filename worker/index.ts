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

	const { sid, file, mirror } = (body ?? {}) as Record<string, unknown>;
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
		waitUntil：写库不能挡住响应。用户这时候正要跳去下载，
		多等一个 D1 往返毫无意义。写失败就吞掉 —— 统计再重要也
		排在「不打扰下载」后面。
	*/
	ctx.waitUntil(
		env.DB.prepare('INSERT INTO clicks (ts, sid, file, mirror) VALUES (?, ?, ?, ?)')
			.bind(Math.floor(Date.now() / 1000), sid, file, mirror)
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
	*/
	const [distinct, byMirror] = await Promise.all([
		env.DB.prepare(
			"SELECT COUNT(DISTINCT sid || '|' || file) AS n FROM clicks WHERE ts >= ? AND ts < ?"
		)
			.bind(from, to)
			.all(),
		env.DB.prepare(
			'SELECT mirror, COUNT(*) AS n FROM clicks WHERE ts >= ? AND ts < ? GROUP BY mirror'
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
		)
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
