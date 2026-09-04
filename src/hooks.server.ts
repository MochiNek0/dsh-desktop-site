import type { Handle } from '@sveltejs/kit';
import { htmlLang, langFromParam } from '$lib/i18n.svelte';

/**
 * 把 app.html 里的 %lang% 占位符换成当前路由的语言标签。
 *
 * <html lang> 是元素属性，svelte:head 碰不到它，所以只能在这一层改。
 * 这个 hook 在预渲染时同样会跑（预渲染用的就是 server build），
 * 于是 /en/index.html 落地时带的就是 lang="en" ——
 * 对搜索引擎和读屏器来说，这是判断页面语言的首要依据。
 */
export const handle: Handle = async ({ event, resolve }) => {
	/*
		/404 的文案是写死的英文（那一页拿不到语言参数，见 NotFound.svelte），
		所以 <html lang> 也要跟着说 en —— 否则读屏器会用中文的读音规则念英文。
	*/
	const lang = event.route.id === '/404' ? 'en' : htmlLang(langFromParam(event.params.lang));

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
