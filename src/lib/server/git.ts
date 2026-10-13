import { execFileSync } from 'node:child_process';

/*
	sitemap 的 lastmod 和文档页的 dateModified 共用这一份：
	两边各算各的，同一篇文档就可能在 sitemap 和页面上报出两个不同的修改时间。
*/

function git(...args: string[]): string {
	try {
		return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return '';
	}
}

/*
	浅克隆里 git log 只看得到最近那一个提交，每篇文档都会拿到同一个
	「最后修改时间」 —— 也就是本次部署的时间，这种日期不可信。
	所以浅克隆（以及根本没有 .git 的构建环境）一律不给日期。
*/
const FULL_HISTORY = git('rev-parse', '--is-shallow-repository') === 'false';

/**
 * 某个文件最后一次提交的时间（ISO 8601）。拿不到可信的值就是 undefined。
 * 还没提交过的文件 git log 输出为空，同样落到 undefined。
 */
export function lastCommitDate(file: string): string | undefined {
	if (!FULL_HISTORY) return undefined;
	return git('log', '-1', '--format=%cI', '--', file) || undefined;
}
