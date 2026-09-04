// 全站预渲染为静态 HTML，交给 Cloudflare 的静态资源托管。
export const prerender = true;

// 关闭 SSR 期间的 trailingSlash 歧义，产出 /faq/index.html 形式，
// 与 wrangler assets 的默认解析行为一致。
export const trailingSlash = 'always';
