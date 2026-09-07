-- 站点累计访问量（会话口径）。
--
-- ── 为什么是两张表，而不是一张明细表 COUNT(*) ────────────────
-- 明细表每次页面加载写一行，然后靠 COUNT(*) 出数：表会无限长，
-- 而这个数**每次首页加载都要读**，等于把最热的读路径压在一张
-- 只会变大的表上。clicks 能这么干是因为它只被每日汇总脚本扫，
-- 一天一次；visitors 是给所有访客看的，量级完全不同。
--
-- 所以拆开：counters 只有一行，读它永远是主键命中；
-- visit_sessions 只负责「这个 sid 今天报过了没」，可以定期删。

-- 单行累计计数器。用 key 而不是固定一行，是留给以后可能加的
-- 其它全站计数（比如 watching 的历史峰值），不用再建表。
CREATE TABLE IF NOT EXISTS counters (
  key TEXT    PRIMARY KEY,
  n   INTEGER NOT NULL DEFAULT 0
);

-- 累计访客数的初始值。
--
-- 这里可以填一个非零的起始数把历史访问补上，但默认是 0：
-- 一个编出来的起点会让旁边那个老实的下载量也变得不可信。
INSERT OR IGNORE INTO counters (key, n) VALUES ('visitors', 0);

-- 会话去重表。
--
-- sid 和 clicks 用的是同一个 sessionStorage 值，关掉标签页就失效，
-- 同样不落 IP、不落 UA —— 它只能回答「这一次会话报过了吗」，
-- 没有跨会话把两次访问关联起来的能力。
CREATE TABLE IF NOT EXISTS visit_sessions (
  sid TEXT    PRIMARY KEY,   -- 主键即去重：重复插入直接 OR IGNORE 掉
  ts  INTEGER NOT NULL       -- unix 秒，只用来清理过期行
);

-- 清理用。没有这个索引，删除过期会话就得全表扫。
CREATE INDEX IF NOT EXISTS idx_visit_sessions_ts ON visit_sessions (ts);
