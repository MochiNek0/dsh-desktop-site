/**
 * 构建期同步 GitHub Release 数据 → src/lib/release-data.json
 *
 * 解决两件事：安装包体积不再手填（用 API 给的精确字节数），
 * 以及下载量有个可展示的数字。版本号也一并从 tag 推出来，
 * 于是 releases.ts / InstallTips 里那条 chmod 命令都跟着自动走。
 *
 * ── 为什么是构建期而不是运行时 ──────────────────────────────
 * 本站的目标用户就是「GitHub 连不上，所以来找镜像」的人。
 * 让首屏数字依赖 api.github.com 等于把它交给一个这批用户大概率
 * 打不通的域名；未认证 API 还有 60 次/小时/IP 的限流，NAT 后面
 * 的办公网很容易打爆。烤进预渲染 HTML 之后运行时零请求。
 *
 * ── 失败一律不阻断构建 ──────────────────────────────────────
 * 产物 JSON 是**提交进仓库**的，取不到就沿用上一次的值。
 * CF 构建机偶发连不上 GitHub（或撞上共享 IP 的限流）不该让部署变红 ——
 * 代价只是数字停在上次成功的那一刻，站点功能完全不受影响。
 * 想避开限流就在构建环境里配 GITHUB_TOKEN。
 *
 * 注意：这里**不用 process.exit()** 提前退出。fetch 还挂着未关闭的
 * handle 时强行 exit，Windows 上的 libuv 会直接断言失败、进程以 127 收场，
 * 反而把「不阻断构建」这个承诺本身打断了。一律走正常返回。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = 'MochiNek0/dsh-desktop';
const OUT = fileURLToPath(new URL('../src/lib/release-data.json', import.meta.url));

/** 资产名形如 dsh-desktop_0.1.10_x64-setup.exe，取出 `_版本_` 之后的那截 */
function suffixOf(name) {
	const m = /^.+?_\d[^_]*_(.+)$/.exec(name);
	return m ? m[1] : name;
}

function readExisting() {
	try {
		return JSON.parse(readFileSync(OUT, 'utf8'));
	} catch {
		return null;
	}
}

/** 取不到新数据时的统一出口：保留仓库里那份 */
function keepExisting(why) {
	const existing = readExisting();
	console.warn(`[sync-release] ${why}`);
	console.warn(
		existing
			? `[sync-release] 沿用仓库里的 release-data.json（v${existing.version}，抓取于 ${existing.fetchedAt}）`
			: '[sync-release] 仓库里也没有 release-data.json —— 体积与下载量将不显示'
	);
}

async function fetchReleases() {
	const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
	const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
		headers: {
			accept: 'application/vnd.github+json',
			'user-agent': 'dsh-desktop-site-build',
			...(token ? { authorization: `Bearer ${token}` } : {})
		},
		signal: AbortSignal.timeout(20_000)
	});
	if (!res.ok) {
		// 读掉 body，别留着未消费的流
		await res.text().catch(() => {});
		const hint = res.status === 403 ? '（多半是未认证限流，配 GITHUB_TOKEN 可避开）' : '';
		throw new Error(`GitHub API 返回 ${res.status}${hint}`);
	}
	return res.json();
}

async function main() {
	let releases;
	try {
		releases = await fetchReleases();
	} catch (err) {
		return keepExisting(`请求 GitHub API 失败：${err.message}`);
	}

	if (!Array.isArray(releases) || releases.length === 0) {
		return keepExisting('GitHub API 没有返回任何 release');
	}

	// 草稿没有公开资产；预发布不该被当成「最新版」推给普通访客
	const published = releases.filter((r) => !r.draft && !r.prerelease);
	const latest = published[0];

	if (!latest) {
		return keepExisting('没有找到正式 release（全是 draft / prerelease）');
	}

	/*
		下载量口径：所有正式版本累加，且明确标注为「GitHub 下载量」。
		镜像（ghproxy 等）是回源 GitHub 的，正常会计入；但它们一旦缓存命中
		就不再回源，那次下载 GitHub 数不到 —— 所以这是个**下限**，
		文案上不能说成「安装量」或「总下载量」。
	*/
	const totalDownloads = published.reduce(
		(sum, r) => sum + (r.assets ?? []).reduce((s, a) => s + (a.download_count ?? 0), 0),
		0
	);

	const assets = Object.fromEntries(
		(latest.assets ?? []).map((a) => [a.name, { size: a.size, downloads: a.download_count ?? 0 }])
	);

	if (Object.keys(assets).length === 0) {
		return keepExisting(`最新 release ${latest.tag_name} 没有任何资产`);
	}

	/*
		资产命名一变，releases.ts 里按文件名的体积查找就会静默落空
		（体积不显示、下载链接 404）。这里跟上一次的后缀集合比一下，
		变了就在构建日志里喊一声 —— 不阻断构建，但足够被看见。
	*/
	const previous = readExisting();
	if (previous) {
		const before = new Set(Object.keys(previous.assets ?? {}).map(suffixOf));
		const after = new Set(Object.keys(assets).map(suffixOf));
		const gone = [...before].filter((s) => !after.has(s));
		const added = [...after].filter((s) => !before.has(s));
		if (gone.length || added.length) {
			console.warn('[sync-release] ⚠ 资产命名有变动，请核对 src/lib/releases.ts 里的文件名：');
			if (gone.length) console.warn(`[sync-release]   消失：${gone.join(', ')}`);
			if (added.length) console.warn(`[sync-release]   新增：${added.join(', ')}`);
		}
	}

	const data = {
		version: String(latest.tag_name).replace(/^v/, ''),
		tag: latest.tag_name,
		totalDownloads,
		assets,
		fetchedAt: new Date().toISOString()
	};

	writeFileSync(OUT, JSON.stringify(data, null, '\t') + '\n');

	// 进制跟站上的 formatSize 保持一致（1024），否则日志和页面会对同一个文件报两个数
	const mb = (b) => `${(b / 1024 ** 2).toFixed(2)} MB`;
	console.log(
		`[sync-release] v${data.version}  下载量合计 ${totalDownloads.toLocaleString('en-US')}`
	);
	for (const [name, a] of Object.entries(assets)) {
		console.log(
			`[sync-release]   ${name}  ${mb(a.size)}  ${a.downloads.toLocaleString('en-US')} 次`
		);
	}
}

await main();
