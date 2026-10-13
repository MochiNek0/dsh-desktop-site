/**
 * 向 IndexNow 提交本次部署真正变了内容的 URL（Bing、Yandex 等共享这份数据）。
 *
 * 分两步，挂在 Workers Builds 的部署命令里：
 *   node scripts/indexnow.mjs prepare && npx wrangler deploy && node scripts/indexnow.mjs
 *
 *   prepare  部署**之前**跑：把 build/ 里每个 sitemap 页面和线上现有版本比一遍，
 *            内容不同的（含新页面）记进 PENDING
 *   无参数   部署**之后**跑：提交 PENDING 里的 URL。提交早了，搜索引擎抓到的还是旧页面
 *
 * ── 为什么比内容而不是看提交标题 ───────────────────────────
 * 手动改动可能只动了响应头、Worker 或脚本，页面一个字没变；按标题判断只能全量提交。
 * IndexNow 要求只提交新增或变更的 URL，经常全量提交会被视为滥用。
 * 比较前先去掉每次构建都会变的部分（脚本、带哈希的资源路径、svelte 样式类），
 * 剩下的才是搜索引擎看得到的内容。
 *
 * 例外：「汇总下载量至 …」每天自动提交一次，只改了首页的一个数字，不提交。
 *
 * 没跑 prepare 就没有 PENDING，这时什么都不提交 —— 宁可漏报，不要乱报。
 * 失败只打日志、不以非零退出：没必要因为 IndexNow 让部署变红。
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HOST = 'dsh-desktop.cc.cd';
const ORIGIN = `https://${HOST}`;
// 与 static/<KEY>.txt 对应，文件内容就是 key 本身。key 本来就是公开的。
const KEY = 'ed9fb6d6fd594226af897ad98cd47dd9';
const BUILD = fileURLToPath(new URL('../build', import.meta.url));
// 不能放进 build/，否则会被当成静态资源一起部署出去
const PENDING = fileURLToPath(new URL('../.indexnow-pending.json', import.meta.url));

/** 去掉构建间必然变化、但搜索引擎看不到的部分 */
function normalize(html) {
	return html
		.replace(/\r/g, '')
		.replace(/<script\b[\s\S]*?<\/script>/g, '')
		.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')
		.replace(/\/_app\/immutable\/[^"'\s)]+/g, '')
		.replace(/\bsvelte-[a-z0-9]+\b/g, '');
}

async function prepare() {
	const subject = execFileSync('git', ['log', '-1', '--format=%s'], { encoding: 'utf8' }).trim();
	if (subject.startsWith('汇总下载量')) {
		console.log(`IndexNow: 「${subject}」无需提交`);
		writeFileSync(PENDING, '[]');
		return;
	}

	const urls = [...readFileSync(`${BUILD}/sitemap.xml`, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
	const changed = [];
	for (const url of urls) {
		const local = readFileSync(`${BUILD}${new URL(url).pathname}index.html`, 'utf8');
		let live = '';
		try {
			const res = await fetch(url);
			if (res.ok) live = await res.text();
		} catch {
			// 拿不到线上版本就当它变了
		}
		if (normalize(local) !== normalize(live)) changed.push(url);
	}
	writeFileSync(PENDING, JSON.stringify(changed));
	console.log(`IndexNow: ${urls.length} 个页面中 ${changed.length} 个有变化`, changed);
}

async function submit() {
	if (!existsSync(PENDING)) {
		console.log('IndexNow: 没有 prepare 的结果，不提交');
		return;
	}
	const urls = JSON.parse(readFileSync(PENDING, 'utf8'));
	rmSync(PENDING);
	if (urls.length === 0) {
		console.log('IndexNow: 没有变化的页面，不提交');
		return;
	}

	try {
		const res = await fetch('https://api.indexnow.org/indexnow', {
			method: 'POST',
			headers: { 'content-type': 'application/json; charset=utf-8' },
			body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: urls })
		});
		// 200 = 已接收，202 = 已接收、key 待校验；其余都是失败
		console.log(`IndexNow: ${res.status}，提交 ${urls.length} 个 URL`);
		if (!res.ok) console.log(await res.text());
	} catch (e) {
		console.log(`IndexNow: 请求失败 ${e}`);
	}
}

try {
	await (process.argv[2] === 'prepare' ? prepare() : submit());
} catch (e) {
	console.log(`IndexNow: 出错 ${e}`);
}
