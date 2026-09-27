import { docsFor, langsOf } from '$lib/docs';
import { htmlLang, LANGS, pathForLang, type Lang } from '$lib/i18n.svelte';
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

/**
 * 一条 <url>。hreflang 要列出**这一页真实存在的全部**语言版本（含自己）+ x-default，
 * 缺一边就是无效标注；只有一个版本时整组不写 —— 单个版本的 hreflang 没有意义。
 */
function urlEntry(pathFor: (l: Lang) => string, langs: Lang[], self: Lang, lastmod?: string): string {
	const links =
		langs.length > 1
			? [
					...langs.map((l) => ({ hreflang: htmlLang(l), href: `${ORIGIN}${pathFor(l)}` })),
					{ hreflang: 'x-default', href: `${ORIGIN}${pathFor(langs[0])}` }
				]
					.map((a) => `\n\t\t<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
					.join('')
			: '';

	// lastmod 缺失时整行不输出，而不是输出一个空的 <lastmod>
	const mod = lastmod ? `\n\t\t<lastmod>${lastmod}</lastmod>` : '';

	return `\t<url>\n\t\t<loc>${ORIGIN}${pathFor(self)}</loc>${links}${mod}\n\t</url>`;
}

export function GET() {
	/*
		文档页不写 lastmod：文档没有可信的修改日期（构建时间每次部署都在变，
		拿它顶替会让搜索引擎判定这个站的日期不可信，进而忽略全部 lastmod）。
	*/
	const pages = LANGS.flatMap((self) => [
		urlEntry(pathForLang, LANGS, self, RELEASE_DATE),
		urlEntry((l) => `${pathForLang(l)}docs/`, LANGS, self),
		...docsFor(self).map((doc) =>
			urlEntry((l) => `${pathForLang(l)}docs/${doc.slug}/`, langsOf(doc.slug), self)
		)
	]);

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
	xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
	xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${pages.join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: { 'content-type': 'application/xml' }
	});
}
