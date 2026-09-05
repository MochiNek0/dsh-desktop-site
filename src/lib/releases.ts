/**
 * 下载源与安装包定义。
 *
 * 设计要点：所有链接都走 GitHub 的 `releases/latest/download/<file>` 形式，
 * 这是一个版本无关的地址，GitHub 会 302 到当前最新 release 的同名资产。
 * 因此发新版本时**不需要改动本站代码** —— 只要资产文件名的格式不变。
 *
 * 但文件名里带版本号（dsh-desktop_0.1.10_x64-setup.exe），所以“最新版”地址
 * 只能用于文件名固定的资产。带版本号的文件必须用精确 tag 地址。
 * 见 LATEST_VERSION 说明。
 */

import releaseData from './release-data.json';
import downloadTotal from './download-total.json';

export const REPO = 'MochiNek0/dsh-desktop';
export const REPO_URL = `https://github.com/${REPO}`;

/**
 * 当前发布版本 —— 由 scripts/sync-release.mjs 在构建期从 GitHub 的
 * 最新正式 release tag 推出，不再手填。
 *
 * 顺带把 InstallTips 里那条带版本号的 AppImage 命令也一起带对了。
 */
export const LATEST_VERSION = releaseData.version;

/**
 * 展示用的下载总量：所有正式版本累加，GitHub 侧 + 镜像侧，已去重。
 *
 * 「所有正式版本」这点必须在页面文案里写出来 —— 这个数字紧挨着
 * 「最新版本 v0.x.y」显示，不写清楚就会被读成那一个版本的下载量。
 *
 * 由 scripts/aggregate-downloads.mjs 每天汇总一次写入 download-total.json，
 * 提交回仓库后随构建烤进 HTML —— 所以它天然滞后最多 24 小时，
 * 页面上必须标明统计间隔，见 dl.downloadsCadence。
 *
 * 这是**估算**：缓存型镜像只有点击数（点击 ≠ 下载成功，偏高），
 * 而 sendBeacon 会被拦截器和关掉的 JS 吃掉（偏低）。看趋势可以，对账不行。
 * 去重公式与两侧误差的完整说明在汇总脚本的文件头。
 */
export const TOTAL_DOWNLOADS = downloadTotal.total;

/**
 * GitHub 侧的精确累计值。
 *
 * 单独留出来是因为它**可核对** —— 用户点进 release 页就能对上。
 * 页面把它放在总量的 tooltip 里，给那个估算值一个可验证的锚点。
 */
export const GITHUB_DOWNLOADS = releaseData.totalDownloads;

/** 总量最后一次汇总的时刻（ISO 8601） */
export const DOWNLOADS_UPDATED_AT = downloadTotal.updatedAt;

/** 上游 DeepSeek Harness 项目 */
export const UPSTREAM_URL = 'https://github.com/deepseek-ai/deepseek-harness';

export type MirrorId = 'ghproxy' | 'ghproxycom' | 'ghfast' | 'llkk' | 'direct';

export interface Mirror {
	id: MirrorId;
	/** 展示名 */
	name: string;
	/** 面向国内用户的一句话说明 key */
	noteKey: string;
	/** 是否推荐给国内用户 */
	recommended: boolean;
	/** 把 GitHub 原始地址包装为该源的下载地址 */
	wrap: (githubUrl: string) => string;
}

export const MIRRORS: Mirror[] = [
	{
		id: 'ghproxy',
		name: 'ghproxy.net',
		noteKey: 'mirror.ghproxy',
		recommended: true,
		wrap: (u) => `https://ghproxy.net/${u}`
	},
	{
		id: 'ghfast',
		name: 'ghfast.top',
		noteKey: 'mirror.ghfast',
		recommended: true,
		wrap: (u) => `https://ghfast.top/${u}`
	},
	{
		id: 'ghproxycom',
		name: 'gh-proxy.com',
		noteKey: 'mirror.ghproxycom',
		recommended: true,
		wrap: (u) => `https://gh-proxy.com/${u}`
	},
	{
		id: 'llkk',
		name: 'gh.llkk.cc',
		noteKey: 'mirror.llkk',
		recommended: true,
		wrap: (u) => `https://gh.llkk.cc/${u}`
	},
	{
		id: 'direct',
		name: 'GitHub',
		noteKey: 'mirror.direct',
		recommended: false,
		wrap: (u) => u
	}
];

export type OsId = 'windows' | 'macos' | 'linux';

export interface Download {
	/** 该安装包的展示标题 key */
	labelKey: string;
	/**
	 * 同一 OS 有多个安装包时，tab 上的短标签 key（如 “AppImage” / “.deb”）。
	 * 只有一个包的平台不渲染 tab，该字段仅作兜底。
	 */
	tabKey: string;
	/** 说明文字 key */
	noteKey: string;
	/** GitHub 资产文件名 */
	file: string;
	/** 同一 OS 下的首选项 */
	primary: boolean;
}

export interface OsGroup {
	id: OsId;
	nameKey: string;
	/** 验证状态 key */
	statusKey: string;
	verified: boolean;
	downloads: Download[];
}

export const OS_GROUPS: OsGroup[] = [
	{
		id: 'windows',
		nameKey: 'os.windows',
		statusKey: 'status.verified',
		verified: true,
		downloads: [
			{
				labelKey: 'dl.win.exe',
				tabKey: 'dl.win.exe.tab',
				noteKey: 'dl.win.exe.note',
				file: `dsh-desktop_${LATEST_VERSION}_x64-setup.exe`,
				primary: true
			}
		]
	},
	{
		id: 'macos',
		nameKey: 'os.macos',
		statusKey: 'status.untested',
		verified: false,
		downloads: [
			{
				labelKey: 'dl.mac.dmg',
				tabKey: 'dl.mac.dmg.tab',
				noteKey: 'dl.mac.dmg.note',
				file: `dsh-desktop_${LATEST_VERSION}_universal.dmg`,
				primary: true
			}
		]
	},
	{
		id: 'linux',
		nameKey: 'os.linux',
		statusKey: 'status.partial',
		verified: true,
		downloads: [
			{
				labelKey: 'dl.linux.appimage',
				tabKey: 'dl.linux.appimage.tab',
				noteKey: 'dl.linux.appimage.note',
				file: `dsh-desktop_${LATEST_VERSION}_amd64.AppImage`,
				primary: true
			},
			{
				labelKey: 'dl.linux.deb',
				tabKey: 'dl.linux.deb.tab',
				noteKey: 'dl.linux.deb.note',
				file: `dsh-desktop_${LATEST_VERSION}_amd64.deb`,
				primary: false
			}
		]
	}
];

/** 某个资产的 GitHub 原始下载地址（锁定到具体 tag，保证文件名匹配） */
export function githubAssetUrl(file: string): string {
	return `${REPO_URL}/releases/download/v${LATEST_VERSION}/${file}`;
}

/** 该资产在指定下载源上的地址 */
export function downloadUrl(file: string, mirror: Mirror): string {
	return mirror.wrap(githubAssetUrl(file));
}

const ASSETS: Record<string, { size: number; downloads: number } | undefined> = releaseData.assets;

/**
 * 该资产的精确字节数；构建期没同步到就是 null（调用方负责不显示）。
 *
 * 会落空的唯一情况是上游改了资产命名 —— sync-release.mjs 检测到后缀集合
 * 变化时会在构建日志里告警，别忽略那条。
 */
export function assetSize(file: string): number | null {
	return ASSETS[file]?.size ?? null;
}

/**
 * 字节数 → 展示用体积。
 *
 * 用 1000 进制而不是 1024：本区块底部就链去 GitHub 的 release 页，
 * 用户最常拿来对照的就是那个数字，而 GitHub 用的是 1000 进制
 * （81,701,368 B 在 GitHub 上显示 81.7 MB，按 1024 算则是 77.9 MiB）。
 * 两个官方页面对同一个文件给出两个数，比「和资源管理器不一致」更让人犯嘀咕。
 *
 * 精度按量级给，统一保持约 3 位有效数字：
 * 小包多一位小数才分得出差别，80 MB 的包给到 0.01 MB 反而是噪声。
 */
export function formatSize(bytes: number): string {
	const mb = bytes / 1e6;
	if (mb < 1) return `${Math.round(bytes / 1e3)} KB`;
	return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`;
}

/** 下载量：带千分位，中英文都读得通 */
export function formatCount(n: number): string {
	return n.toLocaleString('en-US');
}
