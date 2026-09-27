import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { langFromParam } from '$lib/i18n.svelte';
import type { EntryGenerator, PageLoad } from './$types';

/*
	这里的 glob 是**懒的**：拿到的是一张「路径 → 动态 import 函数」的表，
	每篇正文各自成 chunk。客户端只带这张表，点进哪篇下哪篇。
	（侧栏清单的情况不同，见 ../+layout.server.ts。）
*/
const modules = import.meta.glob<{ default: Component }>('/src/docs/*/*.md');

/*
	显式列出要预渲染的每一篇（语言 × 文件名），不靠爬虫从侧栏的链接里发现：
	侧栏结构一改，文档就会安静地从构建产物里消失，而构建仍然是绿的。
*/
export const entries: EntryGenerator = () =>
	Object.keys(modules).map((path) => {
		const [, , , lang, file] = path.split('/');
		return { lang: lang === 'zh' ? '' : lang, slug: file.slice(0, -'.md'.length) };
	});

export const load: PageLoad = async ({ params, data }) => {
	const lang = langFromParam(params.lang);
	const loader = modules[`/src/docs/${lang}/${params.slug}.md`];
	if (!loader) error(404, `No such doc: ${params.slug}`);

	const mod = await loader();
	return { ...data, Content: mod.default, slug: params.slug };
};
