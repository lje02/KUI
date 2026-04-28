export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const ip = url.searchParams.get('ip');

    // 简单校验 IP 参数
    if (!ip) {
        return new Response(JSON.stringify({ error: "Missing IP parameter" }), { 
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    // 计算 7 天前的时间戳 (秒级)
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

    try {
        // 利用 SQLite 内置的时间函数 strftime 进行按天聚合统计
        // 注意：这里使用的是 unixepoch 转换时间戳
        const { results } = await env.DB.prepare(`
            SELECT 
                strftime('%m-%d', datetime(timestamp, 'unixepoch')) as day,
                SUM(delta_bytes) as total_bytes
            FROM traffic_stats
            WHERE ip = ? AND timestamp > ?
            GROUP BY day
            ORDER BY day ASC
        `).bind(ip, sevenDaysAgo).all();

        return new Response(JSON.stringify(results || []), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
