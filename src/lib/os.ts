import type { OsId } from './releases';

/**
 * 猜测访客的操作系统，用于把对应安装包排在最前面。
 *
 * 只用于排序与高亮，不隐藏任何平台 —— 猜错的代价必须是零，
 * 所以其他平台始终可见可下载。
 */
export function detectOs(): OsId | null {
	if (typeof navigator === 'undefined') return null;

	// userAgentData 更可靠，但只有 Chromium 系提供
	const uaData = (
		navigator as Navigator & { userAgentData?: { platform?: string } }
	).userAgentData;
	const platform = (uaData?.platform || navigator.platform || '').toLowerCase();
	const ua = navigator.userAgent.toLowerCase();
	const hay = `${platform} ${ua}`;

	// 顺序有讲究：Android 的 UA 里含 "linux"，必须先排除；
	// iOS/iPadOS 没有桌面安装包，返回 null 让默认顺序生效。
	if (/android/.test(hay)) return null;
	if (/iphone|ipad|ipod/.test(hay)) return null;

	if (/win/.test(hay)) return 'windows';
	if (/mac|darwin/.test(hay)) return 'macos';
	if (/linux|x11|ubuntu|debian|fedora/.test(hay)) return 'linux';

	return null;
}
