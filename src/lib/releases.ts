/**
 * 下载源与安装包定义。
 *
 * 设计要点：所有链接都走 GitHub 的 `releases/latest/download/<file>` 形式，
 * 这是一个版本无关的地址，GitHub 会 302 到当前最新 release 的同名资产。
 * 因此发新版本时**不需要改动本站代码** —— 只要资产文件名的格式不变。
 *
 * 但文件名里带版本号（dsh-desktop_0.1.9_x64-setup.exe），所以“最新版”地址
 * 只能用于文件名固定的资产。带版本号的文件必须用精确 tag 地址。
 * 见 LATEST_VERSION 说明。
 */

export const REPO = 'MochiNek0/dsh-desktop';
export const REPO_URL = `https://github.com/${REPO}`;

/**
 * 当前发布版本。发新版时只改这一处。
 * （Tauri 的资产文件名内嵌版本号，无法用版本无关地址覆盖。）
 */
export const LATEST_VERSION = '0.1.9';

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
	/** 展示用体积（人工维护，只用于给用户一个预期） */
	size: string;
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
				size: '2.4 MB',
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
				size: '6.0 MB',
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
				size: '82 MB',
				primary: true
			},
			{
				labelKey: 'dl.linux.deb',
				tabKey: 'dl.linux.deb.tab',
				noteKey: 'dl.linux.deb.note',
				file: `dsh-desktop_${LATEST_VERSION}_amd64.deb`,
				size: '4.0 MB',
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
