-- 独立访客（人数）口径。
--
-- ── 和 0003 的会话口径有什么不同 ──────────────────────────
-- 0003 的 visit_sessions 用的是 sid：sessionStorage 里的值，
-- 关掉标签页就没了。所以同一个人今天来、明天再来，是两个 sid，
-- 被算成两次 —— 那是「人次」，不是「人数」。
--
-- 这张表用 vid：localStorage 里的长期 id，跨会话存活。
-- 同一个人无论来多少次都只占一行，counters 也只 +1 一次。
--
-- ── 必须说清楚的代价 ──────────────────────────────────────
-- 这确实是跨会话追踪。0001 里「关掉标签页就失效、没有跨会话
-- 追踪能力」那套说法对 vid 不成立 —— 一个能把「今天的访客」和
-- 「下个月的访客」认成同一个人的标识符，就是持久标识符。
--
-- 换来的是名副其实的「人数」。为了把代价压到最低：
--   · 用 localStorage 而不是 cookie —— 不进 HTTP 头、不随请求
--     自动上行，也就不牵扯 Cookie 同意横幅；
--   · 只存 vid 和两个时间戳，不存 IP、不存 UA、不存 referrer，
--     所以这张表没有任何能反查到具体人的信息；
--   · vid 是纯随机数，不从设备指纹派生，用户清一次站点数据就重置。

CREATE TABLE IF NOT EXISTS visitors (
  vid    TEXT    PRIMARY KEY,  -- 主键即去重：同一个人只占一行
  first  INTEGER NOT NULL,     -- 首次出现，unix 秒
  last   INTEGER NOT NULL      -- 最近一次出现，unix 秒
);

-- 按最近活跃时间查（比如以后要算「近 30 天活跃人数」）。
-- 没有它就得全表扫。
CREATE INDEX IF NOT EXISTS idx_visitors_last ON visitors (last);

-- 人数计数器。和 0003 的 'visitors' 键分开：
-- 那个键从现在起表示人次，这个键表示人数，两个数都留着 ——
-- 一旦哪天想对比「人均来几次」，历史数据还在。
INSERT OR IGNORE INTO counters (key, n) VALUES ('people', 0);
