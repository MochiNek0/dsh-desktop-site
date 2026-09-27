import type { EntryGenerator } from './$types';

/** 同首页：两个语言入口显式列出，不靠爬虫从顶栏发现。 */
export const entries: EntryGenerator = () => [{ lang: '' }, { lang: 'en' }];
