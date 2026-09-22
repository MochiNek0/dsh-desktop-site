<script lang="ts">
	/**
	 * 连接门户。
	 *
	 * 它解决的是一件很窄的事：**手机上需要一个地址永远不变的入口**。
	 * 网关的地址会变（DHCP 换 IP、切通道、电脑关机），而 iOS 独立窗口打开一个
	 * 死掉的 origin 时连错误页都没有，就是一片白。这一页在 Cloudflare 边缘上，
	 * 永远打得开，于是主屏幕图标指向它而不是指向网关。
	 *
	 * 它**不**解决的事，在页面底部原样写给用户：测不出哪条通道能通（浏览器不允许
	 * HTTPS 页面探测局域网），也给不了会话凭证（那是按地址存的）。
	 *
	 * 没有后端。清单只进 localStorage —— 理由见 $lib/portal.ts 的模块说明。
	 */
	import Icon from '$lib/components/Icon.svelte';
	import QrScanner from '$lib/components/QrScanner.svelte';
	import { i18n } from '$lib/i18n.svelte';
	import {
		forgetChannel,
		forgetMachine,
		hrefFor,
		load,
		ordered,
		owning,
		parseTarget,
		remember,
		save,
		touch,
		type Channel,
		type Kind,
		type Machine,
		type Reason,
		type Target
	} from '$lib/portal';
	import { ORIGIN } from '$lib/site';

	const t = $derived(i18n.t);

	let machines = $state<Machine[]>([]);
	/** localStorage 读完之前不渲染清单，否则每次进来都会先闪一下「还没有添加」。 */
	let ready = $state(false);

	let scanning = $state(false);
	let typing = $state(false);
	let typed = $state('');
	let why = $state<Reason | null>(null);

	/** 刚扫到或刚粘进来、正在等用户核对的那一个。 */
	let pending = $state<{ target: Target; name: string; into: string | null } | null>(null);

	/**
	 * 已经把人送出去了，正在等电脑那头点同意。
	 *
	 * 网关拿到 pair_token 的第一件事是**作废它**，然后才把问题弹到电脑上，请求
	 * 一直挂着等人回答（桌面端 `remote/proxy.rs` 的 PAIRING_WAIT，两分钟）。也就是
	 * 说这段时间里浏览器还停在这一页上，只有地址栏在转圈 —— 而「连接」那个按钮
	 * 看上去和没点过一模一样。再点一次会发出第二个带着同一个 nonce 的请求，那个
	 * nonce 已经死了，于是手机上立刻弹出「这个二维码已经失效」，而电脑上那个问题
	 * 还好端端地开着。这个标记拦的就是第二下。
	 */
	let connecting = $state(false);

	/** 正在等用户确认删除的那一台。 */
	let removing = $state<Machine | null>(null);

	const listed = $derived(ordered(machines));

	$effect(() => {
		machines = load();
		ready = true;
	});

	/**
	 * 收下一个来路不明的字符串。
	 *
	 * 形状校验在 portal.ts；这里负责的是**校验没过时该把人放在哪**。答案是退回
	 * 手输那一屏并把原文填进去 —— 留在取景器里只会对着同一张图反复报同一条错，
	 * 而用户看不到自己究竟扫到了什么。
	 */
	function offer(raw: string) {
		const parsed = parseTarget(raw);
		if (!parsed.ok) {
			why = parsed.why;
			typed = raw;
			scanning = false;
			typing = true;
			return;
		}

		why = null;
		typed = '';
		scanning = false;
		typing = false;
		connecting = false;

		/*
			这个地址清单里已经有了，就默认并回那一台，而不是默认「新建一台」。最常
			走到这里的不是「又添一台电脑」，而是「上一次没连上，回来再扫一遍」——
			默认新建会让那条路每走一次就多出一张一模一样的卡片。portal.ts 的
			remember() 兜着同一条规矩，这里只是把它摆到用户眼前。
		*/
		const owner = owning(machines, parsed.target.origin);
		pending = {
			target: parsed.target,
			name: owner?.name ?? suggest(parsed.target),
			into: owner?.id ?? null
		};
	}

	/** 域名本身就是个好名字；IP 不是 —— 同一台电脑在三条通道上是三个不同的 IP。 */
	function suggest(target: Target): string {
		const host = new URL(target.origin).hostname;
		return /^[\d.]+$/.test(host) || host.startsWith('[')
			? t('go.confirm.defaultName')
			: host;
	}

	function connect() {
		if (!pending || connecting) return;
		const name = pending.name.trim() || t('go.confirm.defaultName');
		const next = remember(machines, pending.into, name, pending.target);
		save(next);
		machines = next;
		connecting = true;
		location.href = hrefFor(pending.target);
	}

	/**
	 * 清单里的地址直接跳，不再弹确认。
	 *
	 * 确认那一屏防的是「刚扫到一张来路不明的二维码」。清单里这一条是用户自己
	 * 核对过一次才存进来的，每次点都再问一遍只会把它训练成随手划掉的东西 ——
	 * 那样第一次真正需要它的时候，它也一样会被划掉。
	 */
	function open(machine: Machine, channel: Channel) {
		const next = touch(machines, machine.id);
		save(next);
		machines = next;
		location.href = `${channel.origin}/`;
	}

	/*
		删除要问一次 —— 清单没有撤销，删掉就得重扫。

		但不用原生 confirm()：它在 iOS 独立窗口里顶着一行 origin 弹出来，
		和这一页其余三个全屏层完全不是一套东西，而且文案里那对「」引号
		在系统弹窗上没有任何强调，机器名和句子糊成一片。
	*/
	function dropMachine(machine: Machine) {
		removing = machine;
	}

	function confirmDrop() {
		if (!removing) return;
		const next = forgetMachine(machines, removing.id);
		save(next);
		machines = next;
		removing = null;
	}

	function dropChannel(machine: Machine, channel: Channel) {
		const next = forgetChannel(machines, machine.id, channel.id);
		save(next);
		machines = next;
	}

	function startScan() {
		why = null;
		typing = false;
		scanning = true;
	}

	function startTyping() {
		why = null;
		typed = '';
		scanning = false;
		typing = true;
	}

	/*
		通道徽标的配色。公网那条用 accent（站点里唯一的暖色，定位是「强调」）——
		「这台电脑此刻对整个公网开着」正是这一页上唯一值得被强调的事。
	*/
	const TONE: Record<Kind, string> = {
		lan: 'bg-brand-50 text-brand-700',
		tailscale: 'bg-paper-200 text-slate-700',
		public: 'bg-accent-50 text-accent-700',
		unknown: 'bg-paper-200 text-slate-500'
	};

	const manifest = $derived(i18n.lang === 'en' ? '/go-en.webmanifest' : '/go.webmanifest');
</script>

<!--
	pageshow：从网关那边退回来时，iOS 会把这一页连同「正在等同意」的状态一起
	从 bfcache 里原样端出来，而那次等待早就结束了 —— 留着它就是一个再也点不动
	的弹窗。
-->
<svelte:window
	onkeydown={(e) => e.key === 'Escape' && removing && (removing = null)}
	onpageshow={() => (connecting = false)}
/>

<svelte:head>
	<title>{t('go.title')}</title>
	<meta name="description" content={t('go.desc')} />

	<!--
		不进索引：这一页没有可被搜索的内容，只有一个工具，而且它的价值完全取决于
		读者手上有没有一台装了 app 的电脑。让它去和首页争同一批词是纯粹的稀释。
		follow 保留，页脚那几个链接照常传递。
	-->
	<meta name="robots" content="noindex, follow" />

	<!-- 主屏幕图标的落点。scope 限定在 /go/，不把整站变成一个可安装应用。 -->
	<link rel="manifest" href={manifest} />
	<meta name="mobile-web-app-capable" content="yes" />
	<!-- 已废弃，但老 iOS 只认这一个，所以和上面那条一起发 -->
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="dsh" />

	<!--
		不进索引，但要有完整的一组 og —— 这一页正是会被人贴给自己（或队友）
		的那种链接，而半组标注在聊天窗口里就是一条没有标题的裸 URL。
	-->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="dsh desktop" />
	<meta property="og:title" content={t('go.title')} />
	<meta property="og:description" content={t('go.desc')} />
	<meta property="og:url" content={`${ORIGIN}${i18n.lang === 'en' ? '/en' : ''}/go/`} />
	<meta property="og:image" content={`${ORIGIN}${i18n.lang === 'en' ? '/og-en.png' : '/og.png'}`} />
</svelte:head>

<section class="section-x">
	<div class="mx-auto flex w-full max-w-[32rem] flex-col gap-3xl">
		<div class="stack-heading">
			<h1 class="text-3xl font-bold tracking-tight text-slate-900">{t('go.heading')}</h1>
			<p class="text-base/relaxed text-pretty text-slate-600">{t('go.sub')}</p>
		</div>

		<!--
			桌面端那一半还没发。这一页本身是通的 —— 扫码、手输、清单都能用，
			手上已经有地址的人（比如自己编译的）照样进得去，所以只在顶上说一句，
			不去关任何功能。等桌面端发了，删掉这个块即可。
		-->
		<div class="flex items-start gap-sm rounded-2xl border border-brand-200 bg-brand-50 p-lg">
			<Icon name="clock" size={17} cls="mt-0.5 shrink-0 text-brand-600" />
			<div class="flex flex-col gap-2xs">
				<p class="text-sm font-semibold text-brand-800">{t('go.soon.title')}</p>
				<p class="text-sm/relaxed text-pretty text-slate-600">{t('go.soon.body')}</p>
			</div>
		</div>

		{#if ready}
			{#if listed.length === 0}
				<div class="card flex flex-col items-center gap-sm p-2xl text-center">
					<Icon name="scan" size={28} cls="text-slate-400" />
					<p class="font-semibold text-slate-900">{t('go.empty.title')}</p>
					<p class="text-sm/relaxed text-pretty text-slate-600">{t('go.empty.body')}</p>
				</div>
			{:else}
				<ul class="flex flex-col gap-lg">
					{#each listed as machine (machine.id)}
						<li class="card flex flex-col gap-md p-lg">
							<div class="flex items-center justify-between gap-sm">
								<h2 class="truncate font-semibold text-slate-900">{machine.name}</h2>
								<button
									type="button"
									onclick={() => dropMachine(machine)}
									class="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-paper-200 hover:text-slate-700"
									aria-label={t('go.remove')}
									title={t('go.remove')}
								>
									<Icon name="trash" size={16} />
								</button>
							</div>

							<ul class="flex flex-col gap-xs">
								{#each machine.channels as channel (channel.id)}
									<li class="flex items-stretch gap-2xs">
										<!--
											min-w-0：button 自己也是 flex item，min-width 默认 auto —— 它不肯
											比内容更窄，里面那个 truncate 就永远轮不到触发。地址来自对方
											电脑（主机名可以很长），少了这道闸就会把整张卡片顶宽。
										-->
										<button
											type="button"
											onclick={() => open(machine, channel)}
											class="group flex min-h-11 min-w-0 flex-1 items-center gap-sm rounded-xl border border-line px-sm py-2 text-left transition-colors hover:border-line-strong hover:bg-paper-100"
										>
											<span
												class="shrink-0 rounded-md px-2 py-1 text-xs font-semibold {TONE[
													channel.kind
												]}"
											>
												{t(`go.kind.${channel.kind}`)}
											</span>
											<span class="min-w-0 flex-1">
												<span class="block truncate font-mono text-sm text-slate-900">
													{channel.origin}
												</span>
												<span class="block truncate text-xs text-slate-500">
													{t(`go.kind.${channel.kind}Hint`)}
												</span>
											</span>
											<Icon
												name="arrow"
												size={16}
												cls="shrink-0 text-slate-400 transition-colors group-hover:text-brand-600"
											/>
										</button>
										<!--
											只有一条通道时不显示这个 ×：那时它和卡片右上角的
											🗑 是同一个动作（删光最后一条通道，整台机器也跟着
											消失），并排放两个按钮只会让人先犹豫一下该点哪个。
											通道有两条以上时两者才真的不同 —— 🗑 删整台，
											× 单独清掉一个换了 IP 的旧地址。
										-->
										{#if machine.channels.length > 1}
											<button
												type="button"
												onclick={() => dropChannel(machine, channel)}
												class="grid w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-paper-200 hover:text-slate-700"
												aria-label={t('go.removeChannel')}
												title={t('go.removeChannel')}
											>
												<Icon name="close" size={14} />
											</button>
										{/if}
									</li>
								{/each}
							</ul>
						</li>
					{/each}
				</ul>
			{/if}
		{/if}

		<!--
			两个按钮**不**跟着 ready 走：它们不依赖 localStorage，而把它们关进
			那道闸里，预渲染出来的 HTML 上就没有这一页的主操作 —— 慢一点的手机
			上会先看到一块什么都点不了的空白。清单要等读盘（否则每次进来都闪一下
			「还没有添加」），按钮不用。
		-->
		<div class="cluster-cta">
			<button
				type="button"
				onclick={startScan}
				class="flex min-h-11 w-full items-center justify-center gap-xs rounded-xl bg-ink-900 px-5 font-semibold text-white transition-colors hover:bg-ink-800 sm:w-auto"
			>
				<Icon name="scan" size={17} />
				{t('go.scan')}
			</button>
			<button
				type="button"
				onclick={startTyping}
				class="flex min-h-11 w-full items-center justify-center gap-xs rounded-xl border border-line bg-white px-5 font-medium text-slate-700 transition-colors hover:border-line-strong hover:bg-paper-100 sm:w-auto"
			>
				<Icon name="plus" size={16} />
				{t('go.type')}
			</button>
		</div>

		<div class="card flex flex-col gap-sm p-lg">
			<h2 class="flex items-center gap-xs text-sm font-semibold text-slate-900">
				<Icon name="info" size={15} cls="text-slate-400" />
				{t('go.note.heading')}
			</h2>
			<ul class="flex list-disc flex-col gap-xs pl-5 text-sm/relaxed text-slate-600">
				<li>{t('go.note.pick')}</li>
				<li>{t('go.note.repair')}</li>
				<li>{t('go.note.local')}</li>
				<li>{t('go.note.standalone')}</li>
			</ul>
		</div>

		<div class="flex flex-col gap-xs">
			<h2 class="text-sm font-semibold text-slate-900">{t('go.install.heading')}</h2>
			<p class="text-sm/relaxed text-pretty text-slate-600">{t('go.install.body')}</p>
			<p class="text-sm text-slate-500">{t('go.install.ios')}</p>
			<p class="text-sm text-slate-500">{t('go.install.android')}</p>
		</div>
	</div>
</section>

{#if scanning}
	<QrScanner onfound={offer} oncancel={() => (scanning = false)} />
{/if}

<!--
	grid-cols-1（另外两个全屏层同理）：默认的 auto 轨道是按内容的 max-content 量的，
	而下面那个 <select> 的 max-content 是**最长的一个 option**。于是有人给电脑起了
	个长名字，轨道就被撑到比屏幕还宽，w-full 跟着量到这个宽度，弹窗右半边（包括
	「连接」）被 html 上的 overflow-x:hidden 直接裁掉。minmax(0,1fr) 让轨道等于容器。
-->
{#if typing}
	<div class="fixed inset-0 z-[60] grid grid-cols-1 place-items-end bg-ink-950/50 p-lg sm:place-items-center">
		<form
			onsubmit={(e) => {
				e.preventDefault();
				offer(typed);
			}}
			class="card flex w-full max-w-[28rem] flex-col gap-md p-lg"
		>
			<h2 class="font-semibold text-slate-900">{t('go.type.title')}</h2>

			<label class="flex flex-col gap-2xs">
				<span class="text-sm text-slate-600">{t('go.type.label')}</span>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:value={typed}
					type="url"
					inputmode="url"
					autocapitalize="off"
					autocorrect="off"
					spellcheck="false"
					autofocus
					placeholder="http://192.168.1.5:59321"
					class="min-h-11 rounded-xl border border-line bg-paper-100 px-sm font-mono text-sm text-slate-900 outline-none focus:border-brand-400"
				/>
			</label>

			{#if why}
				<p class="text-sm/relaxed text-accent-700">{t(`go.err.${why}`)}</p>
			{/if}

			<div class="flex gap-xs">
				<button
					type="button"
					onclick={() => (typing = false)}
					class="min-h-11 flex-1 rounded-xl border border-line font-medium text-slate-700 transition-colors hover:bg-paper-100"
				>
					{t('go.type.cancel')}
				</button>
				<button
					type="submit"
					class="min-h-11 flex-1 rounded-xl bg-ink-900 font-semibold text-white transition-colors hover:bg-ink-800"
				>
					{t('go.type.submit')}
				</button>
			</div>
		</form>
	</div>
{/if}

{#if pending}
	<div class="fixed inset-0 z-[60] grid grid-cols-1 place-items-end bg-ink-950/50 p-lg sm:place-items-center">
		<div class="card flex w-full max-w-[28rem] flex-col gap-md p-lg">
			<h2 class="font-semibold text-slate-900">{t('go.confirm.title')}</h2>
			<p class="text-sm/relaxed text-pretty text-slate-600">{t('go.confirm.warn')}</p>

			<!--
				主机名单独拎出来放大。这一屏唯一的作用就是让人读到它 ——
				剩下的地址部分（协议、端口）在下面一行小字里，不和它抢注意力。
			-->
			<div class="flex flex-col gap-2xs rounded-xl bg-paper-100 p-sm">
				<span class="font-mono text-lg font-semibold break-all text-slate-900">
					{new URL(pending.target.origin).host}
				</span>
				<span class="font-mono text-xs break-all text-slate-500">{pending.target.origin}</span>
			</div>

			<label class="flex flex-col gap-2xs">
				<span class="text-sm text-slate-600">{t('go.confirm.name')}</span>
				<input
					bind:value={pending.name}
					type="text"
					disabled={connecting}
					class="min-h-11 rounded-xl border border-line bg-paper-100 px-sm text-sm text-slate-900 outline-none focus:border-brand-400"
				/>
			</label>

			{#if listed.length > 0}
				<label class="flex flex-col gap-2xs">
					<span class="text-sm text-slate-600">{t('go.confirm.into')}</span>
					<select
						bind:value={pending.into}
						disabled={connecting}
						class="min-h-11 rounded-xl border border-line bg-paper-100 px-sm text-sm text-slate-900 outline-none focus:border-brand-400"
					>
						<option value={null}>{t('go.confirm.intoNew')}</option>
						{#each listed as machine (machine.id)}
							<option value={machine.id}>{machine.name}</option>
						{/each}
					</select>
				</label>
			{/if}

			<!--
				点过之后整排按钮换掉，而不是灰掉一个。跳转要等电脑上那个人回答，
				这段时间里页面不会有任何别的动静 —— 所以它得自己说出正在等什么，
				否则看上去就是「点了没反应」，而那正是让人再点一次的样子。
			-->
			{#if connecting}
				<div class="flex items-start gap-sm rounded-xl bg-brand-50 p-sm">
					<Icon name="clock" size={16} cls="mt-0.5 shrink-0 text-brand-600" />
					<div class="flex flex-col gap-2xs">
						<p class="text-sm font-semibold text-brand-800">{t('go.confirm.waiting')}</p>
						<p class="text-sm/relaxed text-pretty text-slate-600">{t('go.confirm.waitBody')}</p>
					</div>
				</div>
			{:else}
				<div class="flex gap-xs">
					<button
						type="button"
						onclick={() => (pending = null)}
						class="min-h-11 flex-1 rounded-xl border border-line font-medium text-slate-700 transition-colors hover:bg-paper-100"
					>
						{t('go.confirm.cancel')}
					</button>
					<button
						type="button"
						onclick={connect}
						class="min-h-11 flex-1 rounded-xl bg-ink-900 font-semibold text-white transition-colors hover:bg-ink-800"
					>
						{t('go.confirm.go')}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if removing}
	<!--
		删除确认。危险动作用 accent 实底 —— 站点里唯一的暖色，
		正是留给「这一下不可撤销」这种事的；其余按钮一律 ink-900。
		取消放左边、删除放右边，和上面两个弹窗的左右分工保持一致。
	-->
	<div class="fixed inset-0 z-[60] grid grid-cols-1 place-items-end bg-ink-950/50 p-lg sm:place-items-center">
		<div class="card flex w-full max-w-[28rem] flex-col gap-md p-lg">
			<h2 class="font-semibold break-all text-slate-900">
				{t('go.remove.title', { name: removing.name })}
			</h2>
			<p class="text-sm/relaxed text-pretty text-slate-600">{t('go.remove.body')}</p>

			<div class="flex gap-xs">
				<button
					type="button"
					onclick={() => (removing = null)}
					class="min-h-11 flex-1 rounded-xl border border-line font-medium text-slate-700 transition-colors hover:bg-paper-100"
				>
					{t('go.remove.cancel')}
				</button>
				<button
					type="button"
					onclick={confirmDrop}
					class="min-h-11 flex-1 rounded-xl bg-accent-600 font-semibold text-white transition-colors hover:bg-accent-700"
				>
					{t('go.remove.ok')}
				</button>
			</div>
		</div>
	</div>
{/if}
