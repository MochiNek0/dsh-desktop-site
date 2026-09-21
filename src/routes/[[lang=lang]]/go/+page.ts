import type { EntryGenerator } from './$types';

/**
 * 和首页同理：两个语言入口显式列出。
 *
 * 顶栏和页脚现在都有入口，但**不靠它们被发现**：那两处的 href 是运行时按
 * 当前语言拼出来的，爬不到静态 HTML 里。只靠爬虫发现会让 /en/go/ 安静地
 * 从构建产物里消失，而构建仍然是绿的。
 */
export const entries: EntryGenerator = () => [{ lang: '' }, { lang: 'en' }];
