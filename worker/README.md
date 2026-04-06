# Cloudflare Worker 排行榜部署指南

## 1. 创建 KV Namespace

```bash
# 安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV namespace
wrangler kv namespace create XINGCE_LEADERBOARD
```

记下输出的 `id`，填入 `wrangler.toml` 中的 `id` 字段。

## 2. 修改配置

### wrangler.toml
```toml
[[kv_namespaces]]
binding = "XINGCE_LEADERBOARD"
id = "刚才拿到的 KV namespace ID"
```

### index.html
把 Worker 地址改成你实际的：
```javascript
const API_BASE = 'https://xingce-leaderboard.你的用户名.workers.dev';
```

## 3. 部署 Worker

```bash
cd worker
wrangler deploy
```

部署成功后会得到一个 `https://xingce-leaderboard.你的子域名.workers.dev` 的地址。

## 4. 测试

```bash
# 测试读取
curl https://你的worker地址/leaderboard

# 测试写入
curl -X POST https://你的worker地址/leaderboard \
  -H "Content-Type: application/json" \
  -d '{"name":"测试","category":"language","level":5,"score":5,"maxCombo":3,"totalCorrect":5,"totalWrong":0}'
```

## 5. 迁移旧数据

旧的 `leaderboard.json` 数据可以手动导入 KV：

```bash
# 读取旧数据
cat leaderboard.json | wrangler kv key put --binding XINGCE_LEADERBOARD "leaderboard" --path
```

或者用 API：
```bash
wrangler kv key put --binding XINGCE_LEADERBOARD "leaderboard" "$(cat leaderboard.json)"
```

## 注意事项

- Worker 免费额度：每天 10 万次请求，对小项目完全够用
- KV 免费额度：每天 10 万次读取，1000 次写入
- 如果需要自定义域名，在 Cloudflare Dashboard 中给 Worker 绑定即可
