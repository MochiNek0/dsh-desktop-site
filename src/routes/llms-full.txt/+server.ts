import { docsFor } from '$lib/docs';
import { LANGS, pathForLang, type Lang } from '$lib/i18n.svelte';
import { ORIGIN } from '$lib/site';

/**
 * llms-full.txt —— 全部文档正文拼成一个文件，AI 助手一次读完，不用逐页抓 HTML。
 *
 * 正文直接取 src/docs 的 Markdown 原文，和页面同源，不会出现两份内容。
 * llms.txt 是目录，这里是全文；两者都在构建期生成。
 */
export const prerender = true;

/** 同 sitemap：这是个文件名，不是目录 */
export const trailingSlash = 'never';

const raw = import.meta.glob<string>('/src/docs/*/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
});

/**
 * 去掉 frontmatter，并把站内相对链接改成绝对地址：
 * 脱离了页面，`../plugins/`、`/go/` 这种链接就没有基准可解析了。
 */
function body(md: string, lang: Lang): string {
	const docs = `${ORIGIN}${pathForLang(lang)}docs/`;
	return md
		.replace(/^---[\s\S]*?\n---\s*/, '')
		.replace(/\]\(\.\.\/([^)]*)\)/g, `](${docs}$1)`)
		.replace(/\]\(\/([^)]*)\)/g, `](${ORIGIN}/$1)`)
		.trim();
}

export function GET() {
	const sections = LANGS.flatMap((lang) =>
		docsFor(lang).map((d) => {
			const url = `${ORIGIN}${pathForLang(lang)}docs/${d.slug}/`;
			return `# ${d.headTitle ?? d.title}\n\nURL: ${url}\n\n> ${d.description}\n\n${body(raw[`/src/docs/${lang}/${d.slug}.md`], lang)}`;
		})
	);

	const head = `# dsh desktop — full documentation

> dsh desktop is an unofficial, open-source desktop client for DeepSeek Harness (\`dsh web\`). It is not affiliated with DeepSeek. Summary and links: ${ORIGIN}/llms.txt
`;

	return new Response(`${head}\n${sections.join('\n\n---\n\n')}\n`, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
}
