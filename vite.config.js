import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// 使用 .js 而非 .ts：Vite 载入 .ts 配置时需要先 bundle 该文件，
// 这一步在受限环境里会因无法 spawn 子进程而失败。配置本身很简单，不需要类型标注。
//
// 注意：sveltekit() 来自 '@sveltejs/kit/vite'，
// 而 '@sveltejs/vite-plugin-svelte' v7 只导出 svelte()。
export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
