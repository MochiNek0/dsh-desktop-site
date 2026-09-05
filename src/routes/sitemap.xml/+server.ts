import { htmlLang, LANGS, pathForLang } from '$lib/i18n.svelte';
import { RELEASE_DATE } from '$lib/releases';
import { ORIGIN } from '$lib/site';

/**
 * sitemap.xml —— 构建期生成，不再手写。
 *
 * 从前是 static/sitemap.xml，问题在于它和页面里的 <link rel="alternate">
 * 是两份各自维护的清单。hreflang 这套标注要求双向且完全一致，
 * 对不上 Google 会把整组当作无效丢掉 —— 也就是说这里手滑一个字符，
 * 失效的不是 sitemap 一个文件，是整个多语言标注。
 * 改成和页面共用 LANGS / pathForLang / htmlLang / ORIGIN 之后，
 * 两边不可能再漂移；加语言时也只需要动 LANGS 一处。
 */
export const prerender = true;

/**
 * 覆盖全站的 trailingSlash = 'always'。
 *
 * 和 /404 同理：这是个文件名，不是目录。带斜杠会产出
 * build/sitemap.xml/index.html，而 robots.txt 指的是 /sitemap.xml。
 */
export const trailingSlash = 'never';

/** 每条 <url> 都要列出全部语言版本（含自己）+ x-default，缺一边就是无效标注。 */
const alternates = [
	...LANGS.map((l) => ({ hreflang: htmlLang(l), href: `${ORIGIN}${pathForLang(l)}` })),
	{ hreflang: 'x-default', href: `${ORIGIN}/` }
];

function urlEntry(path: string): string {
	const links = alternates
		.map((a) => `\t\t<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
		.join('\n');

	// RELEASE_DATE 缺失时整行不输出，而不是输出一个空的 <lastmod>
	const lastmod = RELEASE_DATE ? `\n\t\t<lastmod>${RELEASE_DATE}</lastmod>` : '';

	return `\t<url>
\t\t<loc>${ORIGIN}${path}</loc>
${links}${lastmod}
\t</url>`;
}

export function GET() {
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
\txmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
\txmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${LANGS.map((l) => urlEntry(pathForLang(l))).join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: { 'content-type': 'application/xml' }
	});
}
