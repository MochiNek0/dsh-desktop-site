import { langsOf } from '$lib/docs';
import { langFromParam } from '$lib/i18n.svelte';

/*
	正文原文，只给 FAQ 的结构化数据用。服务端 load 只在构建期跑，
	所以这张 eager 表不会进客户端 chunk（同 $lib/docs 的说明）。
*/
const raw = import.meta.glob<string>('/src/docs/*/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
});

/** Markdown 行内标记 → 纯文本。结构化数据里的回答要的是读得通的句子，不是源码。 */
function plain(md: string): string {
	return md
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[`*]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * FAQ 正文 → 问答对：每个 `## ` 标题是一问，到下一个标题前的文字是答。
 *
 * 直接从正文推出来，而不是在别处再写一份问答：两份真相迟早会漂移，
 * 而 Google 要求 FAQPage 标注的内容必须和页面上看得到的一致。
 */
function faqOf(md: string): { q: string; a: string }[] {
	const body = md.replace(/^---[\s\S]*?\n---\s*/, '');
	return body
		.split(/^## /m)
		.slice(1)
		.map((section) => {
			const [q, ...rest] = section.split('\n');
			return { q: plain(q), a: plain(rest.join('\n')) };
		})
		.filter((x) => x.q && x.a);
}

/**
 * langs：这一篇有哪些语言版本，hreflang 和语言切换只能指向真实存在的页面。
 * faq：只有 faq 这一篇有，给 FAQPage 结构化数据用。
 */
export const load = ({ params }) => {
	const md =
		params.slug === 'faq' ? raw[`/src/docs/${langFromParam(params.lang)}/faq.md`] : undefined;
	return { langs: langsOf(params.slug), faq: md ? faqOf(md) : null };
};
