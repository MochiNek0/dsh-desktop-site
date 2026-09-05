-- 点击来源。发帖推广时给链接带上 ?from=juejin 这类参数，取不到就退回
-- referrer 的主机名 —— 用来回答「哪个平台真的带来了下载」。
--
-- NULL 有两种含义，都当「未知来源」处理：直接访问（无参数无 referrer），
-- 以及这一列存在之前的历史行。
--
-- 不建索引：汇总永远先按 ts 区间收窄（idx_clicks_ts 已覆盖），
-- 区间内再 GROUP BY src 的量级不值得多一个索引。
ALTER TABLE clicks ADD COLUMN src TEXT;
