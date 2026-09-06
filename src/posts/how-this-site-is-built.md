---
title: 这个站是怎么搭的
description: SvelteKit 全量预渲染、语言由路由决定、CSS 内联进 head、404 用真实路由 —— 几个不太默认的选择和它们的理由。
date: '2026-09-05'
---

dsh desktop 的官网是一个纯静态站：SvelteKit + `adapter-static`，全量预渲染，扔在 Cloudflare 上。它一共只有几个页面，但有几个地方我没走默认配置，这里记一下理由。

## 语言由路由决定，不由 localStorage

最开始是常见的那种做法：一个 URL，客户端读浏览器语言或者 localStorage，然后切文案。

代价是英文文案**根本进不了预渲染的 HTML**。爬虫看到的永远是中文那一份，一百多条英文翻译对搜索引擎等于不存在。

所以改成了中文在 `/`、英文在 `/en/`，两套 HTML 各自预渲染。i18n 那个 store 就只剩一个「当前语言」的容器，由根 layout 从路由参数**同步**写入：

```ts
i18n.lang = langFromParam(page.params.lang);
```

必须是同步的一行，不能放进 `$effect` —— effect 在预渲染阶段根本不执行，只靠它的话 `/en/` 产出的静态 HTML 会是一整页中文，等于白拆这条路由。

顺便，中文放在 `/` 而不是 `/zh/`：canonical 和已经发出去的链接都指着根路径，再加一层跳转纯属自找麻烦。语言匹配器因此只需要认出 `en` 这一个段，其余路径照常落到 404。

也不做自动跳转。`/` 分享给别人之后变成另一种语言，是一件很难解释的事。

## CSS 直接内联进 head

SvelteKit 有个 `inlineStyleThreshold`，小于这个字节数的路由 CSS 会被内联进 `<head>`，而不是发 `<link rel="stylesheet">`。

默认是 0，也就是从不内联。我把它开到了 45000。

算一下就知道值不值：站点的 CSS 总量不到 40KB，而那个 `<link>` 卡在关键渲染路径上，要多花一趟往返。换掉的是「CSS 能被独立强缓存、跨页复用」这点收益 —— 但绝大多数访客只看一个页面，跨页复用根本用不上。

有一个坑：阈值是按**单个文件**比较的，超过就**静默**退回外链。构建仍然是绿的，首屏悄悄慢一趟。所以这个数字旁边我留了注释写清楚当前实际字节数，涨过去了要么调大，要么就是该瘦身了。

## 404 用真实路由，不用 fallback

`adapter-static` 提供 fallback 页，但它产出的是一个**空壳**：404 的文案要等 JS 下载、水合之后才出现，静态 HTML 里一个字都没有。

改成写一个真实的 `/404` 路由，让它预渲染出 `build/404.html`，内容直接在 HTML 里，配合 wrangler 的 `not_found_handling: "404-page"`。

这里有个容易踩的细节：全站 `trailingSlash` 是 `always`，会产出 `build/404/index.html` —— 而 wrangler 找的是 `build/404.html` 这**一个文件名**。所以这条路由要单独覆盖成 `never`。`sitemap.xml` 同理，它也是个文件名，不是目录。

## 内部链接保持绝对路径

`paths.relative` 默认是 `true`，会把内部链接按每个页面各自改写成相对路径。

于是顶栏里的 `/#download` 在 `/404` 上被解析成 `/404#download`，指向一个不存在的锚点 —— 预渲染时 SvelteKit 直接就报错了。

站点挂在域名根下，没有 base path，绝对路径没有歧义也更好排查，所以设成 `false`。同样的原因，顶栏和页脚里的站内锚点都带上当前语言的首页路径，而不是裸 `#features`。

## sitemap 和页面共用一份数据

sitemap 从前是 `static/sitemap.xml`，手写的。问题在于它和页面里的 `<link rel="alternate">` 是两份各自维护的清单。

hreflang 这套标注要求**双向且完全一致**，对不上 Google 会把整组当作无效直接丢掉。也就是说手滑一个字符，失效的不是 sitemap 一个文件，是整个多语言标注。

现在改成构建期生成，和页面共用同一套语言常量和路径函数。两边不可能再漂移，加语言时也只需要动一处。

## 字体自托管

Inter 走 `@fontsource-variable`，随构建产物走，不用 Google Fonts CDN —— 静态站已经在 CDN 上了，外域字体会多一次 DNS 加 TLS 往返，正好卡在首屏关键路径上。

体积上不亏：这个包会产出七个 woff2 共两百多 KB，但每个 `@font-face` 都带 `unicode-range`，浏览器只下载页面真正用到的子集。中文和英文用户都只拉拉丁那一个，约 47KB，其余永不请求。汉字由系统字体承担 —— Inter 本身就没有汉字字形。

有个更隐蔽的坑：fontsource v5 注册的族名是 `Inter Variable`，不是 v3 时代的 `Inter var`。名字写错不会报任何错，只会静默回落到系统 UI 字体。页面「说不上哪不对但就是像模板」，一度就是这个原因。
