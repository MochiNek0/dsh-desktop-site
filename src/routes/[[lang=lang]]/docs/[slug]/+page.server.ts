import { langsOf } from '$lib/docs';

/** 这一篇有哪些语言版本：hreflang 和语言切换只能指向真实存在的页面。 */
export const load = ({ params }) => ({ langs: langsOf(params.slug) });
