import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { createHighlighter } from 'shiki';

/*
	博客正文里出现的语言。写死一张表而不是用 shiki 的全量包：
	全量包会把 200 多种语法一起拉进构建，而这里只需要这几种。
	表外的语言不会报错，走下面的 plaintext 兜底。

	名字带 CODE_ 前缀是为了别和 i18n 里的 LANGS（站点语言）看混。
*/
const CODE_LANGS = [
	'bash',
	'json',
	'ts',
	'js',
	'svelte',
	'css',
	'html',
	'md',
	'toml',
	'rust',
	'diff'
];

/*
	高亮在**构建期**做完，产物是带 inline style 的纯 HTML —— 页面上没有任何
	高亮相关的运行时 JS。这和站点其它地方是同一条原则：装饰不许占主线程。

	颜色改用 github-dark，并把它的底色 #24292e 换成本站的 ink-900，
	好和首页 CodeBlock 那块深色代码框长得一样。
*/
const highlighter = await createHighlighter({
	themes: ['github-dark'],
	langs: CODE_LANGS
});

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.md'],
	highlight: {
		highlighter(code, lang) {
			const html = highlighter.codeToHtml(code, {
				lang: CODE_LANGS.includes(lang ?? '') ? lang : 'text',
				theme: 'github-dark',
				colorReplacements: { '#24292e': '#1f1f22' }
			});

			/*
				必须转义花括号。mdsvex 是把这段 HTML 直接拼进 .svelte 源码再编译的，
				代码块里一个 `{` 就会被当成 Svelte 表达式的开头 —— 编译直接报错，
				或者更糟：`{a}` 被当成变量插值，静默渲染成空字符串。
				shiki 的输出里除了代码本身没有花括号（style 属性是 `color:#xxx`），
				所以整段替换是安全的。
			*/
			return html.replace(/[{}]/g, (c) => (c === '{' ? '&#123;' : '&#125;'));
		}
	}
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// .md 也当成组件编译，博客正文就是这么进路由的
	extensions: ['.svelte', '.md'],
	preprocess: [mdsvex(mdsvexOptions)],
	kit: {
		/*
			relative: false —— 内部链接保持根绝对路径（/、/en/、/#download）。

			默认的 true 会把它们按每个页面各自改写成相对路径，于是 Header 里
			`/#download` 在 /404 上被解析成 /404#download，指到一个不存在的锚点。
			本站就挂在域名根下，没有 base path，绝对路径没有歧义也更好排查。
		*/
		paths: { relative: false },
		/*
			把路由用到的 CSS 直接内联进 <head>，消掉两个渲染阻塞请求。

			本站只有 3 个预渲染页面，CSS 总量 ~38.7KB（未压缩），
			而这两个 <link rel="stylesheet"> 在关键路径上要多花一趟往返 ——
			首屏速度换掉「CSS 独立强缓存」这点收益是划算的：
			绝大多数访客只看一个页面，跨页复用根本用不上。

			阈值按**单个文件**比较，超过就静默退回外链。
			当前共享的 0.*.css 是 41447，博客正文的路由 chunk 是 2232，
			也就是只剩 3.5KB 余量；CSS 涨过这个数就要么调大，要么就是该瘦身了。

			博客的排版样式因此一律写在 /blog 路由自己的 <style> 里（Svelte 作用域
			样式会进独立的路由 chunk），不进 app.css。注意 Tailwind v4 是单文件输出，
			在博客组件里用**新的** Tailwind 类同样会长进上面这个文件 —— 复用已有的类
			不要钱，新加的要钱。
		*/
		inlineStyleThreshold: 45000,
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
