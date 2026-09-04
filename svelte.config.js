import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		/*
			relative: false —— 内部链接保持根绝对路径（/、/en/、/#download）。

			默认的 true 会把它们按每个页面各自改写成相对路径，于是 Header 里
			`/#download` 在 /404 上被解析成 /404#download，指到一个不存在的锚点。
			本站就挂在域名根下，没有 base path，绝对路径没有歧义也更好排查。
		*/
		paths: { relative: false },
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			/*
				不用 fallback：adapter-static 的 fallback 产出的是一个**空壳**，
				404 的文案要等 JS 加载、水合之后才出现 —— 静态 HTML 里一个字都没有。
				改成由 src/routes/404 这个真实路由预渲染出 build/404.html，
				内容直接在 HTML 里，配合 wrangler 的 not_found_handling: "404-page"。
			*/
			precompress: false,
			strict: true
		})
	}
};

export default config;
