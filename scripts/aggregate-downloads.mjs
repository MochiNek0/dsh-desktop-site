/**
 * 每日汇总下载总量 → src/lib/download-total.json
 *
 * 站上显示的「总下载」= GitHub 侧 + 镜像侧，且去过重。由 GitHub Actions
 * 每天跑一次，把结果提交回仓库，Workers Builds 随之重新部署。
 * 所以页面上的数字天然是「隔 24 小时」的，文案必须写明。
 *
 * ── 为什么不能把两个数直接相加 ──────────────────────────────
 * 同一次下载会被两边同时记上：
 *   从本站点「GitHub 直连」        → GitHub +1，本站点击 +1
 *   从本站点镜像、镜像回源 GitHub  → GitHub +1，本站点击 +1
 *   从本站点镜像、镜像缓存命中      → 只有本站点击
 *   直接去 GitHub 页面 / 自动更新   → 只有 GitHub
 * 直接相加会把前两类算两遍。
 *
 * ── 去重公式 ────────────────────────────────────────────────
 *   本期新增 = 本站去重点击
 *            + max(0, GitHub 增量 − 本站原始点击中会打到 GitHub 的那部分)
 *
 * 第二项算出来的是「不经本站的下载」，和第一项互斥，可以放心相加。
 *
 * 两个口径故意不对称：
 *   第一项用**去重**计数（同一会话同一文件换几个镜像点 = 一次下载）；
 *   减数用**原始**计数（每次点击都可能在 GitHub 那边 +1，减多一点更安全）。
 * 方向是刻意的 —— 宁可少算总量，不可虚报。
 *
 * ── 这个数是估算，不是精确值 ────────────────────────────────
 * 残留误差两侧都有：缓存型镜像的点击 ≠ 下载成功（高估）；
 * sendBeacon 会被拦截器和关掉的 JS 吃掉（低估）。
 * 拿来看趋势可以，拿来对账不行。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = 'MochiNek0/dsh-desktop';
const OUT = fileURLToPath(new URL('../src/lib/download-total.json', import.meta.url));
const SITE = process.env.SITE_ORIGIN || 'https://dsh-desktop.cc.cd';

/**
 * 会回源 GitHub 的下载源 —— 它们的点击要从 GitHub 增量里减掉。
 *
 * 默认把全部源都当成透传，这是**最保守**的假设：减得最多，总量最小。
 * 实测确认某个镜像是缓存型（下载后 GitHub 的 download_count 不动）之后，
 * 把它从这个数组里删掉，总量会相应上调。
 * 'direct' 必须永远留着 —— 那本来就是直连 GitHub。
 */
const PASS_THROUGH = ['direct', 'ghproxy', 'ghproxycom', 'ghfast', 'llkk'];

/** windows 只留最近这么多条，够画趋势又不会让文件无限长 */
const KEEP_WINDOWS = 90;

function fail(msg) {
	console.error(`[aggregate] ✗ ${msg}`);
	process.exitCode = 1;
}

async function githubCumulative() {
	const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
	const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
		headers: {
			accept: 'application/vnd.github+json',
			'user-agent': 'dsh-desktop-site-stats',
			...(token ? { authorization: `Bearer ${token}` } : {})
		},
		signal: AbortSignal.timeout(20_000)
	});
	if (!res.ok) {
		await res.text().catch(() => {});
		throw new Error(`GitHub API 返回 ${res.status}`);
	}
	const releases = await res.json();
	return releases
		.filter((r) => !r.draft && !r.prerelease)
		.reduce(
			(sum, r) => sum + (r.assets ?? []).reduce((s, a) => s + (a.download_count ?? 0), 0),
			0
		);
}

async function siteClicks(from, to) {
	const token = process.env.STATS_TOKEN;
	if (!token) throw new Error('缺少 STATS_TOKEN');
	const res = await fetch(`${SITE}/api/daily?from=${from}&to=${to}`, {
		headers: { authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(20_000)
	});
	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`/api/daily 返回 ${res.status} ${body.slice(0, 200)}`);
	}
	return res.json();
}

async function main() {
	let state;
	try {
		state = JSON.parse(readFileSync(OUT, 'utf8'));
	} catch {
		return fail(`读不到 ${OUT} —— 这个文件是提交进仓库的，不该缺失`);
	}

	const now = Math.floor(Date.now() / 1000);
	const from = Math.floor(new Date(state.since).getTime() / 1000);
	if (!Number.isSafeInteger(from) || from >= now) {
		return fail(`since 字段不合法或在未来：${state.since}`);
	}

	let ghNow, clicks;
	try {
		[ghNow, clicks] = await Promise.all([githubCumulative(), siteClicks(from, now)]);
	} catch (err) {
		// 汇总失败就整个放弃，绝不写半截文件 —— 宁可数字停一天
		return fail(`取数失败：${err.message}`);
	}

	/*
		GitHub 的累计值理论上只增不减，但删掉一个 release 会让它掉下来。
		真掉了就把本期 GitHub 增量记 0，并把基准重置到新值，
		否则后面每一期都会被这个负数污染。
	*/
	if (ghNow < state.githubCumulative) {
		console.warn(
			`[aggregate] ⚠ GitHub 累计值下降（${state.githubCumulative} → ${ghNow}），` +
				'多半是删了 release。本期 GitHub 增量按 0 计。'
		);
	}
	const githubDelta = Math.max(0, ghNow - state.githubCumulative);

	const byMirror = clicks.byMirror ?? {};
	const subtracted = PASS_THROUGH.reduce((s, id) => s + (byMirror[id] ?? 0), 0);
	const outside = Math.max(0, githubDelta - subtracted);

	if (githubDelta - subtracted < 0) {
		console.warn(
			`[aggregate] ⚠ 减数(${subtracted})大于 GitHub 增量(${githubDelta})，已钳到 0。` +
				'说明 PASS_THROUGH 里有源其实是缓存型的，或者信标被刷了 —— 该复查了。'
		);
	}

	const site = Number(clicks.distinct ?? 0);
	const windowTotal = site + outside;

	const entry = {
		from: state.since,
		to: new Date(now * 1000).toISOString(),
		site,
		githubDelta,
		subtracted,
		outside,
		total: windowTotal
	};

	const next = {
		...state,
		total: state.total + windowTotal,
		githubCumulative: ghNow,
		since: entry.to,
		updatedAt: entry.to,
		windows: [...(state.windows ?? []), entry].slice(-KEEP_WINDOWS)
	};

	writeFileSync(OUT, JSON.stringify(next, null, '\t') + '\n');

	console.log(
		`[aggregate] 本期 +${windowTotal}（本站去重 ${site}，站外 ${outside}）` +
			`  累计 ${next.total.toLocaleString('en-US')}`
	);
	console.log(
		`[aggregate]   GitHub 增量 ${githubDelta}，减去透传点击 ${subtracted}` +
			`  各源原始点击 ${JSON.stringify(byMirror)}`
	);
}

await main();
