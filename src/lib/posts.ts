/**
 * 博客文章清单 —— 从 src/posts/*.md 的 frontmatter 直接生成。
 *
 * 不另外维护一份「文章目录」文件：那种清单和正文是两处真相，
 * 新写一篇忘了登记，文章就安静地不出现在列表和 sitemap 里，构建还是绿的。
 *
 * ⚠️ 只许在**构建期/服务端**代码里 import（/blog 的 +page.server.ts、sitemap）。
 * 这里的 glob 是 eager 的，被打进客户端 chunk 的话，
 * 光是打开列表页就会把所有正文一起下载下来。
 */

export interface PostMeta {
	/** URL 里的那一段，取自文件名 */
	slug: string;
	title: string;
	description: string;
	/** YYYY-MM-DD。用字符串是因为它同时要进 <time datetime> 和 sitemap 的 <lastmod> */
	date: string;
}

const frontmatter = import.meta.glob<Record<string, string>>('/src/posts/*.md', {
	eager: true,
	import: 'metadata'
});

/** 全部文章，新的在前。 */
export const posts: PostMeta[] = Object.entries(frontmatter)
	.map(([path, meta]) => {
		const slug = path.slice('/src/posts/'.length, -'.md'.length);

		// 缺字段就让构建失败。渲染成 "undefined" 再被搜索引擎抓走要难查得多。
		for (const key of ['title', 'description', 'date'] as const) {
			if (!meta?.[key]) throw new Error(`src/posts/${slug}.md 的 frontmatter 缺少 ${key}`);
		}

		/*
			date 必须写成**带引号**的 '2026-09-06'。

			不加引号的话 YAML 会把它认成日期类型，mdsvex 再序列化成
			'2026-09-06T00:00:00.000Z' —— 于是页面上安静地显示成「9 月 NaN 日」，
			构建全程是绿的。这一条就是把那个坑变成构建期报错。
		*/
		if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
			throw new Error(
				`src/posts/${slug}.md 的 date 要写成带引号的 'YYYY-MM-DD'，现在是 ${meta.date}`
			);
		}

		return { slug, title: meta.title, description: meta.description, date: meta.date };
	})
	.sort((a, b) => b.date.localeCompare(a.date));
