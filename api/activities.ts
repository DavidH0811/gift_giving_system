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
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, message: '获取活动失败' });
    }

    const formattedData = data.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      date: item.date,
      totalAmount: Number(item.total_amount) || 0,
    }));

    return res.json(formattedData);
  }

  if (req.method === 'POST') {
    const { title, type, date } = req.body;

    const { data, error } = await supabase
      .from('activities')
      .insert([{ title, type, date, total_amount: 0 }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message, message: '创建活动失败' });
    }

    return res.json({
      id: data.id,
      title: data.title,
      type: data.type,
      date: data.date,
      totalAmount: Number(data.total_amount) || 0,
    });
  }

  return res.status(405).json({ message: '不支持的请求方法' });
}
