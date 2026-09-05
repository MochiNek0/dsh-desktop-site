/**
 * 站点根地址。
 *
 * canonical、og:url、hreflang、sitemap、结构化数据里的绝对链接全部从这里取。
 * 必须是绝对地址 —— 相对路径在被抓取或转发时会解析到错误的源。
 *
 * 单独成一个模块是因为页面和 sitemap 两边都要用：写死两份的话，
 * 换域名时漏掉一处，sitemap 里的 <loc> 和页面里的 canonical 就会互相打架，
 * 而这种不一致 Google 是直接丢弃整组标注的。
 */
export const ORIGIN = 'https://dsh-desktop.cc.cd';
