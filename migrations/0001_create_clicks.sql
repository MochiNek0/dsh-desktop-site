-- 下载点击原始记录。
--
-- 不存 IP、不存 UA：sid 是客户端每次会话随机生成的 16 位十六进制，
-- 只用来把「同一次会话里换了几个镜像」收敛成一次下载，关掉浏览器就失效。
CREATE TABLE IF NOT EXISTS clicks (
  ts     INTEGER NOT NULL,  -- unix 秒
  sid    TEXT    NOT NULL,
  file   TEXT    NOT NULL,
  mirror TEXT    NOT NULL
);

-- 每日汇总只按时间区间扫，这个索引就是全部的查询模式
CREATE INDEX IF NOT EXISTS idx_clicks_ts ON clicks (ts);
