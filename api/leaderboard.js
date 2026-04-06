// Vercel Serverless Function - 排行榜 API
// 使用 Upstash Redis 存储
import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const raw = await kv.get('leaderboard');
      const data = raw || { language: [], math: [], logic: [], data: [], common: [] };
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, category, level, score, maxCombo, totalCorrect, totalWrong } = req.body;
      const cats = ['language', 'math', 'logic', 'data', 'common'];

      if (!name || !category || !cats.includes(category)) {
        return res.status(400).json({ error: '参数错误' });
      }

      const raw = await kv.get('leaderboard');
      const lb = raw || { language: [], math: [], logic: [], data: [], common: [] };

      lb[category].push({
        name: String(name).slice(0, 12),
        category,
        level: Number(level) || 0,
        score: Number(score) || 0,
        maxCombo: Number(maxCombo) || 0,
        totalCorrect: Number(totalCorrect) || 0,
        totalWrong: Number(totalWrong) || 0,
        date: Date.now(),
      });

      for (const key of cats) {
        lb[key] = (lb[key] || [])
          .sort((a, b) => b.level - a.level || b.score - a.score || b.maxCombo - a.maxCombo)
          .slice(0, 50);
      }

      await kv.set('leaderboard', lb);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
