// 行测大闯关 排行榜 - Cloudflare Worker
// 使用 KV 存储，按分类存储排行榜数据

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS 处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    // 只处理 /leaderboard 路径
    if (url.pathname !== '/leaderboard') {
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // ====== GET: 读取排行榜 ======
    if (request.method === 'GET') {
      try {
        const raw = await env.LB.get('data');
        const data = raw ? JSON.parse(raw) : {
          language: [], math: [], logic: [], data: [], common: []
        };
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: corsHeaders
        });
      }
    }

    // ====== POST: 提交分数 ======
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const { name, category, level, score, maxCombo, totalCorrect, totalWrong } = body;

        // 验证
        const cats = ['language', 'math', 'logic', 'data', 'common'];
        if (!name || !category || !cats.includes(category)) {
          return new Response(JSON.stringify({ error: '参数错误' }), {
            status: 400, headers: corsHeaders
          });
        }

        // 读现有数据
        const raw = await env.LB.get('data');
        const lb = raw ? JSON.parse(raw) : {
          language: [], math: [], logic: [], data: [], common: []
        };

        // 插入新记录
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

        // 排序，每个分类保留前 50
        for (const key of cats) {
          lb[key] = (lb[key] || [])
            .sort((a, b) => b.level - a.level || b.score - a.score || b.maxCombo - a.maxCombo)
            .slice(0, 50);
        }

        // 写回 KV
        await env.LB.put('data', JSON.stringify(lb));

        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: corsHeaders
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: corsHeaders
    });
  },
};
