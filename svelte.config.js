import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			// 纯静态站点：不存在的路径交给 404.html，
			// 配合 wrangler 的 not_found_handling: "404-page"。
			fallback: '404.html',
			precompress: false,
			strict: true
		})
	}
};

export default config;
