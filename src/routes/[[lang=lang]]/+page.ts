import type { EntryGenerator } from './$types';

/**
 * 显式列出要预渲染的两个语言入口。
 *
 * 不靠爬虫从 header 的链接里发现 /en/：那样一旦有人改了导航结构，
 * 英文页就会安静地从构建产物里消失，而构建仍然是绿的。
 */
export const entries: EntryGenerator = () => [{ lang: '' }, { lang: 'en' }];
