import type { ParamMatcher } from '@sveltejs/kit';

/**
 * 只放行 'en'。
 *
 * 中文是默认语言，住在根路径 `/`（而不是 `/zh/`）—— 站点的 canonical、
 * 已发出去的链接都指着 `/`，再加一层跳转纯属自找麻烦。
 * 所以这个匹配器只需要认出「非默认语言」那一个段。
 *
 * 收紧到白名单同时也保证 `/foo/` 之类的路径不会被 [[lang]] 吞掉当成首页，
 * 而是照常落到 404。
 */
export const match: ParamMatcher = (param) => param === 'en';
