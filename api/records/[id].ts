import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { activityId, activityTitle, giverName, amount } = req.body;

    try {
      // 查询旧记录金额
      const { data: oldRecord } = await supabase
        .from('gift_records')
        .select('amount, activity_id')
        .eq('id', id)
        .single();

      // 更新记录
      const { data, error } = await supabase
        .from('gift_records')
        .update({
          activity_id: activityId,
          activity_title: activityTitle,
          giver_name: giverName,
          amount: Number(amount),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 同步更新活动总金额（差值）
      if (oldRecord && oldRecord.activity_id === activityId) {
        const diff = Number(amount) - Number(oldRecord.amount);
        if (diff !== 0) {
          const { data: activity } = await supabase
            .from('activities')
            .select('total_amount')
            .eq('id', activityId)
            .single();

          if (activity) {
            await supabase
              .from('activities')
              .update({ total_amount: Number(activity.total_amount || 0) + diff })
              .eq('id', activityId);
          }
        }
      }

      return res.json({
        id: data.id,
        activityId: data.activity_id,
        activityTitle: data.activity_title,
        giverName: data.giver_name,
        amount: Number(data.amount),
        timestamp: data.timestamp,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message, message: '更新记录失败' });
    }
  }

  return res.status(405).json({ message: '不支持的请求方法' });
}
