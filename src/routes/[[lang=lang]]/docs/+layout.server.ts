import { docsFor } from '$lib/docs';
import { langFromParam } from '$lib/i18n.svelte';

/**
 * 侧栏清单走 **服务端 load**：$lib/docs 用的是 eager glob，
 * 放进通用 load 会把所有正文一起打进客户端 chunk。
 * 服务端 load 只在构建期跑，结果被序列化进预渲染产物，
 * 客户端拿到的只有这几个字段。
 */
export const load = ({ params }) => ({ docs: docsFor(langFromParam(params.lang)) });
