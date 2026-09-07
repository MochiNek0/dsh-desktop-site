/**
 * 会话标识与来源标记。
 *
 * 从 Download.svelte 抽出来共用：下载点击（/api/click）和访客计数
 * （/api/visit）必须用**同一个** sid，否则同一次访问在两张表里是
 * 两个不同的人，以后想把「访客 → 下载」的转化率对起来就不可能了。
 *
 * ── 两个标识，两种生命周期 ──────────────────────────────
 * sid（sessionStorage）：关掉标签页就失效。下载去重、人次统计用它。
 * vid（localStorage）：跨会话存活，用来数「人数」—— 这是有意为之的
 * 跨会话追踪，取舍写在 visitorId() 的注释里。
 *
 * 两者都不落 IP、不落 UA。
 */

const SID_KEY = 'dsh-site-sid';
const SRC_KEY = 'dsh-site-src';
const VID_KEY = 'dsh-site-vid';

/** 生成一个 16 位十六进制随机标识 —— sid 和 vid 共用同一套格式 */
function randomId(): string {
	const b = crypto.getRandomValues(new Uint8Array(8));
	return [...b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

/**
 * 长期访客 id —— 用来数「人数」而不是「人次」。
 *
 * ── 和 sid 的区别 ────────────────────────────────────────
 * sid 在 sessionStorage 里，关掉标签页就没了，所以同一个人
 * 明天再来会是一个新 sid，被算成两次访问。vid 在 localStorage 里
 * 跨会话存活，同一个人无论来多少次都只算一个人。
 *
 * ── 必须承认的代价 ──────────────────────────────────────
 * 这是跨会话追踪。sid 那套「关掉标签页就失效」的说法对 vid 不成立。
 * 为了把代价压到最低，做了三件事：
 *
 *   1. 用 localStorage 而不是 cookie。cookie 会自动附在**每一个**
 *      请求上（包括静态资源），既浪费带宽，又要牵扯 Cookie 同意横幅；
 *      localStorage 只在这里主动读一次，不进 HTTP 头。
 *   2. vid 是纯随机数，不从 UA / 屏幕尺寸 / 字体这类设备指纹派生 ——
 *      用户清一次站点数据就彻底重置，我们没有任何办法把新旧 vid 关联起来。
 *   3. 服务端只存 vid 和两个时间戳，不存 IP、不存 UA。
 *      所以这个 id 除了「是同一个浏览器」之外说明不了任何事。
 *
 * localStorage 不可用（隐私模式、被禁用）时返回 null：
 * 这类访客读得到数字但不被计入，和 sid 的处理一致 ——
 * 宁可少算，不可虚报。
 */
export function visitorId(): string | null {
	try {
		let vid = localStorage.getItem(VID_KEY);
		if (!vid) {
			vid = randomId();
			localStorage.setItem(VID_KEY, vid);
		}
		return vid;
	} catch {
		return null;
	}
}

/**
 * 来源标记的合法字符集。
 *
 * ⚠️ 必须和 worker/index.ts 的 SRC_RE 保持一致，
 * 否则这边发得出去、那边照样丢掉。
 */
export const SRC_RE = /^[a-z0-9._-]{1,32}$/;

/**
 * 本次会话的随机 id —— 16 位十六进制。
 *
 * 只用来去重：把「同一次会话里换了几个镜像」收敛成一次下载，
 * 把「同一个人刷新了五次」收敛成一次访问。
 *
 * 隐私模式下 sessionStorage 会抛异常，这时返回 null：
 * 调用方一律理解为「这次不统计」，功能本身不受影响。
 */
export function sessionId(): string | null {
	try {
		let sid = sessionStorage.getItem(SID_KEY);
		if (!sid) {
			sid = randomId();
			sessionStorage.setItem(SID_KEY, sid);
		}
		return sid;
	} catch {
		return null;
	}
}

/**
 * 从当前地址和 referrer 推断来源。
 *
 * 优先取 ?from=：发帖时手工给每个平台一个不同的值，这是唯一可靠的
 * 一手数据。取不到才退回 referrer 主机名 —— referrer 会被平台的
 * 跳转中转页和各种 referrer policy 抹掉，只能当补充，不能当依据。
 */
function detectSource(): string {
	const from = new URLSearchParams(location.search).get('from')?.toLowerCase();
	if (from && SRC_RE.test(from)) return from;
	try {
		const host = new URL(document.referrer).hostname.replace(/^www\./, '').toLowerCase();
		// 站内跳转（比如中英切换）不是来源
		if (host !== location.hostname && SRC_RE.test(host)) return host;
	} catch {
		// referrer 为空或不是合法 URL —— 直接访问，没有来源可记
	}
	return '';
}

/**
 * 本次会话的来源标记，没有则为 null。
 *
 * 必须缓存进 sessionStorage：?from= 只在落地那一刻存在，而用户往往
 * 是读完整页才点下载，那时地址栏可能已经没有它了。
 */
export function clickSource(): string | null {
	try {
		let src = sessionStorage.getItem(SRC_KEY);
		if (src === null) {
			src = detectSource();
			sessionStorage.setItem(SRC_KEY, src);
		}
		// "" 表示「查过了，确实没来源」，别和「还没查」混为一谈
		return src || null;
	} catch {
		return null;
	}
}
