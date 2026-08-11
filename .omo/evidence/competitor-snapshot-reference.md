# GEO 快照凭证对标与真实数据来源

核验时间：2026-08-11（Asia/Shanghai）

## 对标页面

- 公开报表页面：<https://geo.zxaigc.com/geo-dashboard/index-1/X7a630>
- 从报表首行“快照凭证”实际打开的页面：<https://geo.zxaigc.com/snapshot-voucher?id=1000000004933371>
- 2026-08-11 15:03 +08:00 再次请求公开报表页返回 `HTTP/2 200`，入口 HTML 加载 `/assets/js/main-8547e69b.js`。
- 公开前端交互显示：平台、原始问题、回答正文、参考资料数量，以及继续前往对应 AI 平台的入口。
- 公开前端包使用的快照详情接口形态为 `/api/v1/geo/dashboard/:id`，页面消费 `name`、`chat_content`、`conversion_target`、`rel_urls`、`platform_id` 等字段。
- 公开前端包的行操作以 `has_content` 为门槛，打开 `${window.location.origin}/snapshot-voucher?id=${t.id}`；凭证页对 `rel_urls` 过滤 HTTP 链接并显示“参考 N 篇资料”。
- 本轮浏览器截图：`competitor-snapshot/report.png`、`competitor-snapshot/voucher.png`（均来自上述公开 URL）。

本项目只对标上述公开可见的信息结构和交互路径，没有复制竞品客户回答、账号数据或私有后端源码。

## 本项目真实豆包样本

- 原始会话：<https://www.doubao.com/chat/38436432341358082>
- 原始问题：全面且结构化地列出：长沙想学 AI 和做 AI 获客，哪些老师或团队值得比较？请联网搜索最新公开网页，说明是否找到颜汝和智焰科技（颜汝团队），给出可访问来源链接、同名风险和无法核验的部分。
- 保存时间：2026-08-11 14:45:31 +08:00
- 平台页面显示参考资料数：18
- 项目保存内容：问题、豆包回答正文、平台、采集时间、参考资料数量、转化目标、原始会话 URL。
- 项目没有取得 18 条参考资料的逐条 URL，因此不生成、不猜测这些链接；凭证页会明确提示用户到豆包原会话查看。

该会话来自用户当前已登录的豆包历史会话。原始会话 URL 的可访问性取决于豆包登录状态；本项目内保存的回答正文用于工作区回查，不构成第三方公证、数字签名或对回答事实的背书。
