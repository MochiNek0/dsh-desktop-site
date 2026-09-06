import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import type { EntryGenerator, PageLoad } from './$types';

interface Frontmatter {
	title: string;
	description: string;
	date: string;
}

/*
	这里的 glob 是**懒的**：拿到的是一张「路径 → 动态 import 函数」的表，
	每篇正文各自成 chunk。客户端只带这张表，点进哪篇下哪篇。
	（列表页的情况不同，见 ../+page.server.ts 的注释。）
*/
const modules = import.meta.glob<{ default: Component; metadata: Frontmatter }>('/src/posts/*.md');

const PREFIX = '/src/posts/';

/*
	显式列出要预渲染的文章，理由和首页的 entries 一样：
	不靠爬虫从列表页的链接里发现。列表页的结构一改，
	文章就会安静地从构建产物里消失，而构建仍然是绿的。
*/
export const entries: EntryGenerator = () =>
	Object.keys(modules).map((path) => ({ slug: path.slice(PREFIX.length, -'.md'.length) }));

export const load: PageLoad = async ({ params }) => {
	const loader = modules[`${PREFIX}${params.slug}.md`];
	if (!loader) error(404, `没有这篇文章：${params.slug}`);

	const post = await loader();
	return { Content: post.default, meta: post.metadata, slug: params.slug };
};
