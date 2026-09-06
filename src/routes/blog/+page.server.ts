import { posts } from '$lib/posts';

/**
 * 文章列表走 **+page.server.ts** 而不是 +page.ts。
 *
 * $lib/posts 用的是 eager glob，会把所有 .md 一起拉进来。放在通用 load 里，
 * 这段代码同时也会打进客户端 chunk —— 用户只是点开列表页，就把每一篇正文
 * 都下载了一遍。服务端 load 只在构建期跑，列表结果被序列化进预渲染产物，
 * 客户端拿到的就只有这四个字段。
 */
export const load = () => ({ posts });
