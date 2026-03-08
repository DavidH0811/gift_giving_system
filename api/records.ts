import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('gift_records')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, message: '获取记录失败' });
    }

    return res.json(
      data.map(item => ({
        id: item.id,
        activityId: item.activity_id,
        activityTitle: item.activity_title,
        giverName: item.giver_name,
        amount: Number(item.amount),
        timestamp: item.timestamp,
      }))
    );
  }

  if (req.method === 'POST') {
    const { activityId, activityTitle, giverName, amount } = req.body;

    try {
      // 1. 插入记录
      const { data: record, error: recordError } = await supabase
        .from('gift_records')
        .insert([{
          activity_id: activityId,
          activity_title: activityTitle,
          giver_name: giverName,
          amount: Number(amount),
          timestamp: new Date().toISOString(),
        }])
        .select()
        .single();

      if (recordError) throw recordError;

      // 2. 更新活动总金额
      const { data: activity } = await supabase
        .from('activities')
        .select('total_amount')
        .eq('id', activityId)
        .single();

      if (activity) {
        await supabase
          .from('activities')
          .update({ total_amount: Number(activity.total_amount || 0) + Number(amount) })
          .eq('id', activityId);
      }

      // 3. 新增宾客（如不存在）
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('name', giverName)
        .single();

      if (!existingGuest) {
        await supabase.from('guests').insert([{ name: giverName }]);
      }

      return res.json({
        id: record.id,
        activityId: record.activity_id,
        activityTitle: record.activity_title,
        giverName: record.giver_name,
        amount: Number(record.amount),
        timestamp: record.timestamp,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message, message: '添加记录失败' });
    }
  }

  return res.status(405).json({ message: '不支持的请求方法' });
}
