/**
 * 下载源自动选优：给每个候选源发一个极小的探针请求，测「通不通、多快」，
 * 挑一个胜出者。
 *
 * ── 探针打在哪 ──────────────────────────────────────────────
 * 打在**本次 release 里最小的那个资产**上（见 releases.ts 的 probeUrl）。
 * 这不是随便挑的：这些源全是 gh-proxy 一系的反代，只代理白名单内的
 * GitHub 地址。早先版本拿 github.githubassets.com 的 favicon 当探针，
 * 那个域名不在白名单里，所有代理一律返回错误 —— 于是活得好好的源
 * 全被标成「不可用」，而用户点下载明明能下。
 *
 * 打在真实资产上还顺带解决了代表性问题：测的就是下载时走的那条链路。
 *
 * ── 为什么用 fetch 而不是 <img> ────────────────────────────
 * 早先版本用 `<img>` 探测，理由是不受 CORS 限制。代价是它只能探图片：
 * 响应不是可解码的图片就走 onerror，和「真的没连上」无从区分。
 * release 资产不是图片，所以这条路直接堵死。
 *
 * fetch 能拿到真正的 HTTP 状态，但依赖目标返回 CORS 头。
 * gh-proxy 一系默认会带 `access-control-allow-origin: *`（它自己就是给
 * 浏览器用的），可没法保证每个部署都带 —— 所以做两级：
 *   1. cors 模式：成功则能读到 res.ok，这是**最强**的信号
 *   2. 被 CORS 挡下时退到 no-cors：拿不到状态码，但「请求发出去且有响应」
 *      本身已经证明这个域名是通的，足以参与排序
 * 两级都失败才判定不可用。宁可多一次请求，也不要再出现误判。
 */

import { MIRRORS, probeUrl, type Mirror, type MirrorId } from './releases';

export interface ProbeResult {
	id: MirrorId;
	/** 往返耗时（毫秒），失败/超时为 null */
	ms: number | null;
	ok: boolean;
	timedOut: boolean;
	/**
	 * 成功信号的强度：
	 *   'status'  读到了 HTTP 状态码，确认是 2xx —— 可信
	 *   'opaque'  被 CORS 挡住，只知道「有响应」—— 可用但未经校验
	 * 失败时为 null。UI 目前不区分这两者，留给排序和排查用。
	 */
	via: 'status' | 'opaque' | null;
}

const PROBE_TIMEOUT_MS = 3000;
/*
	带版本号：探针换了目标和方法之后，上一版缓存里存的是「全部不可用」的
	错误结论。不换 key 的话，老访客会在 5 分钟窗口里继续看到那份错判。
*/
const CACHE_KEY = 'dsh-site-mirror-race-v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟内认为测速结果仍然有效

interface CachedRace {
	at: number;
	results: ProbeResult[];
}

/** 拿到响应头就够了，别把探针文件真的读完 —— 顺手取消掉 body */
function discard(res: Response) {
	try {
		void res.body?.cancel();
	} catch {
		// 某些实现里 body 已被消费/锁定，忽略
	}
}

async function probeOne(mirror: Mirror): Promise<ProbeResult> {
	const url = probeUrl(mirror);
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
	const start = performance.now();
	const elapsed = () => Math.round(performance.now() - start);

	const fail = (timedOut: boolean): ProbeResult => ({
		id: mirror.id,
		ok: false,
		timedOut,
		ms: null,
		via: null
	});

	try {
		// 第一级：正常的跨域请求，能读到状态码
		try {
			const res = await fetch(url, {
				mode: 'cors',
				cache: 'no-store',
				redirect: 'follow',
				signal: ctrl.signal
			});
			discard(res);
			return res.ok
				? { id: mirror.id, ok: true, timedOut: false, ms: elapsed(), via: 'status' }
				: // 有响应但不是 2xx：这个源确实在，但不给这个文件 —— 当作不可用
					fail(false);
		} catch (err) {
			// 超时走 abort，和 CORS 失败要分开：超时没必要再试第二级
			if (ctrl.signal.aborted) return fail(true);

			// 第二级：CORS 头缺失时的兜底，只求证明「这个域名有响应」
			await fetch(url, {
				mode: 'no-cors',
				cache: 'no-store',
				redirect: 'follow',
				signal: ctrl.signal
			});
			return { id: mirror.id, ok: true, timedOut: false, ms: elapsed(), via: 'opaque' };
		}
	} catch {
		return fail(ctrl.signal.aborted);
	} finally {
		clearTimeout(timer);
	}
}

/** 并发测速全部候选源，返回每个源的结果（顺序与 MIRRORS 一致）。 */
export async function raceMirrors(): Promise<ProbeResult[]> {
	const settled = await Promise.allSettled(MIRRORS.map(probeOne));
	return settled.map((r, i) =>
		r.status === 'fulfilled'
			? r.value
			: { id: MIRRORS[i].id, ok: false, timedOut: false, ms: null, via: null }
	);
}

/**
 * 从测速结果里选出最优源：可用者按延迟升序，取最快的一个；全部失败则返回 null。
 *
 * 同样快的情况下优先取 via==='status' 的 —— 那个是确认过 HTTP 状态的，
 * 比只知道「有响应」的 opaque 更可信。
 */
export function pickBest(results: ProbeResult[]): MirrorId | null {
	const usable = results.filter((r) => r.ok && r.ms !== null);
	if (usable.length === 0) return null;
	usable.sort((a, b) => {
		const d = (a.ms as number) - (b.ms as number);
		// 100ms 以内算「差不多快」，这时让可信度更高的那个胜出
		if (Math.abs(d) > 100) return d;
		const rank = (r: ProbeResult) => (r.via === 'status' ? 0 : 1);
		return rank(a) - rank(b) || d;
	});
	return usable[0].id;
}

function readCache(): CachedRace | null {
	try {
		const raw = sessionStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CachedRace;
		if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
		return parsed;
	} catch {
		return null;
	}
}

function writeCache(results: ProbeResult[]) {
	try {
		sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), results }));
	} catch {
		// 隐私模式/容量满都无所谓，只是这次不缓存
	}
}

/**
 * 取一份测速结果：会话内 5 分钟缓存命中则直接复用，否则实测一次并写入缓存。
 */
export async function raceMirrorsCached(): Promise<ProbeResult[]> {
	const cached = readCache();
	if (cached) return cached.results;
	const results = await raceMirrors();
	writeCache(results);
	return results;
}
