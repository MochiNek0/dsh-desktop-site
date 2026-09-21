/**
 * 连接门户的数据层：地址校验、通道判别，以及那份只存在浏览器里的机器清单。
 *
 * ── 为什么没有后端 ────────────────────────────────────────
 * 门户要记住的东西只有一样：「哪台电脑在哪个地址上」。而那份清单一旦集中
 * 存到服务器上，它就是一张「可达、且背后是一个完整 shell」的端点目录 ——
 * 一个比任何单台机器都值钱的目标。存在用户自己的浏览器里，泄露面就只有
 * 那一台手机，代价是换手机要重扫一次。这笔交换是故意的。
 *
 * ── 为什么 parseTarget 这么严 ─────────────────────────────
 * 跳转目标来自扫码，也就是来自页面之外的任意一张图片。门户读完就把用户
 * 送过去，所以它天然是一个开放重定向 —— 形状不对一律拒绝是第一道闸，
 * 第二道是跳转前把主机名摆给人看（在 +page.svelte 里）。两道都不能省。
 */

// ── 类型 ──────────────────────────────────────────────────

/**
 * 一个地址属于哪条通道。纯粹按主机名判断，只用来给用户一个标签和一句
 * 「什么时候用它」，不参与任何安全决定。
 */
export type Kind = 'lan' | 'tailscale' | 'public' | 'unknown';

/** 一台电脑上的一个可达地址。`origin` 永远是裸 origin，不含路径与查询。 */
export interface Channel {
	id: string;
	origin: string;
	kind: Kind;
}

export interface Machine {
	id: string;
	name: string;
	channels: Channel[];
	/** 最近一次从这里跳出去的时间，只用来排序。 */
	usedAt: number;
}

/**
 * 刚扫到或刚粘进来、还没被接受的一个地址。
 *
 * `pairToken` 只跟着这一次跳转走，**不进 `Machine`、不落盘**：它是一次性的、
 * 五分钟过期，存下来只会在第二天点开时变成一个必然失败的参数，而失败的样子
 * 恰好和「凭证过期」一模一样，徒增一类查不出原因的故障。
 */
export interface Target {
	origin: string;
	kind: Kind;
	pairToken?: string;
}

/** parseTarget 的拒绝理由。每一条在 i18n 里都有一句对应的人话。 */
export type Reason = 'empty' | 'shape' | 'scheme' | 'userinfo' | 'path' | 'query' | 'loopback';

export type Parsed = { ok: true; target: Target } | { ok: false; why: Reason };

// ── 校验 ──────────────────────────────────────────────────

/**
 * 配对 nonce 的形状：16 字节 base64url，也就是 22 个字符。
 *
 * 与桌面端 `remote/session.rs` 的 `random()` 对齐。注意 `docs/mobile-connection-roadmap.md`
 * 里写的是「32 hex」—— 那是规划时的写法，实际实现从来没按十六进制发过。
 */
const PAIR_TOKEN = /^[A-Za-z0-9_-]{22}$/;

export function parseTarget(raw: string): Parsed {
	const text = raw.trim();
	if (!text) return { ok: false, why: 'empty' };

	/*
		没写协议时补 http://。不能把裸字符串直接交给 URL 构造：
		'192.168.1.5:59321' 会被当成协议 '192.168.1.5:' 解析成功，
		得到一个和用户本意毫无关系、但看起来合法的东西。
	*/
	const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `http://${text}`;

	let url: URL;
	try {
		url = new URL(withScheme);
	} catch {
		return { ok: false, why: 'shape' };
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, why: 'scheme' };
	// user:pass@host 是把人骗过去的经典写法：前半段显示成人畜无害的样子。
	if (url.username || url.password) return { ok: false, why: 'userinfo' };
	if (url.pathname !== '/' || url.hash) return { ok: false, why: 'path' };
	// 回环是电脑自己的地址（卡片上那条 Cloudflare ingress 就长这样），
	// 在手机上永远指向手机自己，放进来只会得到一次莫名其妙的连接失败。
	if (isLoopback(url.hostname)) return { ok: false, why: 'loopback' };

	const token = url.searchParams.get('pair_token') ?? undefined;
	for (const key of url.searchParams.keys()) {
		if (key !== 'pair_token') return { ok: false, why: 'query' };
	}
	if (token !== undefined && !PAIR_TOKEN.test(token)) return { ok: false, why: 'query' };

	return {
		ok: true,
		target: { origin: url.origin, kind: kindOf(url.hostname), pairToken: token }
	};
}

function isLoopback(hostname: string): boolean {
	return hostname === 'localhost' || hostname === '[::1]' || /^127\./.test(hostname);
}

/**
 * 主机名 → 通道。
 *
 * 判 Tailscale 只看 `100.64.0.0/10`，**没有**桌面端 `remote/tunnel.rs` 那一层
 * 网卡名交叉验证 —— 浏览器里没有网卡可看。所以运营商的 CGNAT 地址在这里会被
 * 标成 Tailscale。这是个标签错误，不是安全问题：标签不决定任何事，跳到哪里
 * 完全由用户确认过的那个 origin 决定。
 */
function kindOf(hostname: string): Kind {
	const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
	if (!v4) {
		// IPv6 字面量判不出是 tailnet 还是公网，与其猜不如说不知道；
		// 其余（带点的域名）就是用户自己的域名，也就是 Cloudflare 那条通道。
		return hostname.startsWith('[') ? 'unknown' : 'public';
	}

	const a = Number(v4[1]);
	const b = Number(v4[2]);

	if (a === 100 && b >= 64 && b <= 127) return 'tailscale';
	if (a === 10) return 'lan';
	if (a === 172 && b >= 16 && b <= 31) return 'lan';
	if (a === 192 && b === 168) return 'lan';
	if (a === 169 && b === 254) return 'lan';
	return 'public';
}

/** 真正要跳过去的地址。配对 nonce 只在刚扫到的那一次带上。 */
export function hrefFor(target: Target): string {
	return target.pairToken ? `${target.origin}/?pair_token=${target.pairToken}` : `${target.origin}/`;
}

// ── 清单 ──────────────────────────────────────────────────

const KEY = 'dsh-portal.machines.v1';

export function load(): Machine[] {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter(intact) : [];
	} catch {
		/*
			隐私模式下 localStorage 可能直接抛，写坏的 JSON 也一样。
			两种都当「还没有任何机器」—— 让整页白掉换不来任何东西，
			而用户重扫一次就能回到原地。
		*/
		return [];
	}
}

export function save(machines: Machine[]): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(machines));
	} catch {
		// 存不下就算了。抛出去只会让「连接」这个按钮看起来没有反应。
	}
}

/** 读回来的东西至少得长这样，否则丢掉 —— 见 load() 的容错约定。 */
function intact(value: unknown): value is Machine {
	const m = value as Machine;
	return (
		!!m &&
		typeof m.id === 'string' &&
		typeof m.name === 'string' &&
		Array.isArray(m.channels) &&
		m.channels.every((c) => c && typeof c.id === 'string' && typeof c.origin === 'string')
	);
}

export function newId(): string {
	return crypto.randomUUID();
}

/**
 * 把一个地址并进清单。
 *
 * `into` 是要并入的机器 id，`null` 表示新建一台。同一台机器上已经有一模一样的
 * origin 时不产生第二条 —— 重扫一次同一台电脑是最常见的动作，它不该每次都
 * 在卡片上多出一行。
 */
export function remember(
	machines: Machine[],
	into: string | null,
	name: string,
	target: Target
): Machine[] {
	const channel: Channel = { id: newId(), origin: target.origin, kind: target.kind };
	const now = Date.now();

	if (into === null) {
		return [...machines, { id: newId(), name, channels: [channel], usedAt: now }];
	}

	return machines.map((machine) => {
		if (machine.id !== into) return machine;
		const known = machine.channels.some((c) => c.origin === target.origin);
		return {
			...machine,
			name,
			channels: known ? machine.channels : [...machine.channels, channel],
			usedAt: now
		};
	});
}

/** 记一次使用，用来把最近用过的那台顶到最前面。 */
export function touch(machines: Machine[], machineId: string): Machine[] {
	return machines.map((m) => (m.id === machineId ? { ...m, usedAt: Date.now() } : m));
}

export function forgetMachine(machines: Machine[], machineId: string): Machine[] {
	return machines.filter((m) => m.id !== machineId);
}

/** 删掉一个地址；删光了这台机器就整台消失，不留一张没有任何入口的空卡片。 */
export function forgetChannel(machines: Machine[], machineId: string, channelId: string): Machine[] {
	return machines
		.map((m) =>
			m.id === machineId ? { ...m, channels: m.channels.filter((c) => c.id !== channelId) } : m
		)
		.filter((m) => m.channels.length > 0);
}

/** 最近用过的排前面。 */
export function ordered(machines: Machine[]): Machine[] {
	return [...machines].sort((a, b) => b.usedAt - a.usedAt);
}
