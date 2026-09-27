/**
 * 文档清单 —— 从 src/docs/<lang>/*.md 的 frontmatter 直接生成。
 *
 * 不另外维护一份目录文件：那种清单和正文是两处真相，
 * 新写一篇忘了登记，文档就安静地不出现在侧栏和 sitemap 里，构建还是绿的。
 *
 * 同一篇文档的中英文靠**文件名相同**配对（zh/install.md ↔ en/install.md）。
 * 允许只写一种语言：缺的那一边不出现在侧栏里，hreflang 也只列真实存在的版本。
 *
 * ⚠️ 只许在**构建期/服务端**代码里 import（docs 的 +layout.server.ts、sitemap）。
 * 这里的 glob 是 eager 的，被打进客户端 chunk 的话，
 * 光是打开文档首页就会把所有正文一起下载下来。
 */

import { LANGS, type Lang } from './i18n.svelte';

export interface DocMeta {
	/** URL 里的那一段，取自文件名 */
	slug: string;
	lang: Lang;
	title: string;
	description: string;
	/** 侧栏排序，小的在前 */
	order: number;
}

const frontmatter = import.meta.glob<Record<string, unknown>>('/src/docs/*/*.md', {
	eager: true,
	import: 'metadata'
});

const all: DocMeta[] = Object.entries(frontmatter).map(([path, meta]) => {
	const [, , , lang, file] = path.split('/');
	const slug = file.slice(0, -'.md'.length);
	const where = `src/docs/${lang}/${file}`;

	if (!LANGS.includes(lang as Lang)) throw new Error(`${where}：不认识的语言目录 ${lang}`);

	// 缺字段就让构建失败。渲染成 "undefined" 再被搜索引擎抓走要难查得多。
	for (const key of ['title', 'description', 'order'] as const) {
		if (meta?.[key] === undefined || meta[key] === '') {
			throw new Error(`${where} 的 frontmatter 缺少 ${key}`);
		}
	}

	return {
		slug,
		lang: lang as Lang,
		title: String(meta.title),
		description: String(meta.description),
		order: Number(meta.order)
	};
});

/** 某个语言下的全部文档，按 order 排好。 */
export function docsFor(lang: Lang): DocMeta[] {
	return all.filter((d) => d.lang === lang).sort((a, b) => a.order - b.order);
}

/** 这一篇文档有哪些语言版本 —— hreflang 只能列真实存在的那些。 */
export function langsOf(slug: string): Lang[] {
	return LANGS.filter((l) => all.some((d) => d.slug === slug && d.lang === l));
}
