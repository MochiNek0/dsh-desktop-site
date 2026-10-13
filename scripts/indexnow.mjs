/**
 * 部署完成后向 IndexNow 提交本次变更的 URL（Bing、Yandex 等共享这份数据）。
 *
 * 挂在 Workers Builds 的部署命令后面：npx wrangler deploy && node scripts/indexnow.mjs
 * 必须在部署**之后**跑 —— 提交早了，搜索引擎来抓到的还是旧页面。
 *
 * ── 提交哪些 URL ───────────────────────────────────────────
 * 按触发这次部署的提交标题判断（浅克隆也拿得到 HEAD 的标题）：
 *   「汇总下载量至 …」  每日自动提交，只改了一个数字 → 不提交
 *   「同步 …」          发版，变的是首页的版本号/体积 → 只提交两个首页
 *   其它（手动改动）    不细分改了哪页 → 提交 sitemap 里的全部 URL
 * IndexNow 要求只提交新增或变更的 URL，每天无差别全量提交会被视为滥用。
 *
 * 失败只打日志、不以非零退出：部署这时已经完成，没必要让构建变红。
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HOST = 'dsh-desktop.cc.cd';
const ORIGIN = `https://${HOST}`;
// 与 static/<KEY>.txt 对应，文件内容就是 key 本身。key 本来就是公开的。
const KEY = 'ed9fb6d6fd594226af897ad98cd47dd9';
const SITEMAP = fileURLToPath(new URL('../build/sitemap.xml', import.meta.url));

const subject = execFileSync('git', ['log', '-1', '--format=%s'], { encoding: 'utf8' }).trim();

let urls;
if (subject.startsWith('汇总下载量')) {
	urls = [];
} else if (subject.startsWith('同步 ')) {
	urls = [`${ORIGIN}/`, `${ORIGIN}/en/`];
} else {
	urls = [...readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

if (urls.length === 0) {
	console.log(`IndexNow: 「${subject}」无需提交`);
	process.exit(0);
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
