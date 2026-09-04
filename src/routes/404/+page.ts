export const prerender = true;

/**
 * 覆盖全站的 trailingSlash = 'always'。
 *
 * 带斜杠会产出 build/404/index.html，而 wrangler 的
 * not_found_handling: "404-page" 找的是 build/404.html 这一个文件名。
 * 'never' 才能落到正确的位置。
 */
export const trailingSlash = 'never';
