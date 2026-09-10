import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// 使用 .js 而非 .ts：Vite 载入 .ts 配置时需要先 bundle 该文件，
// 这一步在受限环境里会因无法 spawn 子进程而失败。配置本身很简单，不需要类型标注。
//
// 注意：sveltekit() 来自 '@sveltejs/kit/vite'，
// 而 '@sveltejs/vite-plugin-svelte' v7 只导出 svelte()。

/**
 * vite dev 不会跑 Cloudflare Worker，/api/* 会直接 404。
 * 本地给访问统计一个固定响应，页面才能完整跑起来。
 * 真 D1 用 `npm run build && npx wrangler dev`。
 */
const LOCAL_VISIT_TOTAL = 3289;

/** @returns {import('vite').Plugin} */
function localVisitApi() {
	return {
		name: 'local-visit-api',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/api/visit', (_req, res) => {
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({ total: LOCAL_VISIT_TOTAL }));
			});
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), localVisitApi()]
});
