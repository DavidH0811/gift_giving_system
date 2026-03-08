import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env vars from server/.env
dotenv.config({ path: './server/.env' });

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ SUPABASE_URL and SUPABASE_KEY are not fully configured in server/.env');
}

const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseKey || 'public-anon-key');

// GET /api/activities
app.get('/api/activities', async (req, res) => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({ error: error.message, message: '获取活动失败' });
  }

  // Transform data format if needed
  const formattedData = data.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    date: item.date,
    totalAmount: Number(item.total_amount) || 0
  }));

  res.json(formattedData);
});

// POST /api/activities
app.post('/api/activities', async (req, res) => {
  const { title, type, date } = req.body;

  const { data, error } = await supabase
    .from('activities')
    .insert([{ title, type, date, total_amount: 0 }])
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    return res.status(500).json({ error: error.message, message: '创建活动失败' });
  }

  res.json({
    id: data.id,
    title: data.title,
    type: data.type,
    date: data.date,
    totalAmount: Number(data.total_amount) || 0
  });
});

// GET /api/records
app.get('/api/records', async (req, res) => {
  const { data, error } = await supabase
    .from('gift_records')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching records:', error);
    return res.status(500).json({ error: error.message, message: '获取记录失败' });
  }

  const formattedData = data.map(item => ({
    id: item.id,
    activityId: item.activity_id,
    activityTitle: item.activity_title,
    giverName: item.giver_name,
    amount: Number(item.amount),
    timestamp: item.timestamp
  }));

  res.json(formattedData);
});

// POST /api/records
app.post('/api/records', async (req, res) => {
  const { activityId, activityTitle, giverName, amount } = req.body;

  try {
    // 1. Insert Record
    const { data: record, error: recordError } = await supabase
      .from('gift_records')
      .insert([{
        activity_id: activityId,
        activity_title: activityTitle,
        giver_name: giverName,
        amount: Number(amount),
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (recordError) throw recordError;

    // 2. Update Activity total_amount
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

    // 3. Upsert Guest
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('id')
      .eq('name', giverName)
      .single();

    if (!existingGuest) {
      await supabase.from('guests').insert([{ name: giverName }]);
    }

    res.json({
      id: record.id,
      activityId: record.activity_id,
      activityTitle: record.activity_title,
      giverName: record.giver_name,
      amount: Number(record.amount),
      timestamp: record.timestamp
    });
  } catch (error: any) {
    console.error('Error adding record:', error);
    res.status(500).json({ error: error.message, message: '添加记录失败' });
  }
});

// PUT /api/records/:id
app.put('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  const { activityId, activityTitle, giverName, amount } = req.body;

  try {
    const { data: oldRecord } = await supabase
      .from('gift_records')
      .select('amount, activity_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('gift_records')
      .update({
        activity_id: activityId,
        activity_title: activityTitle,
        giver_name: giverName,
        amount: Number(amount)
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

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

    res.json({
      id: data.id,
      activityId: data.activity_id,
      activityTitle: data.activity_title,
      giverName: data.giver_name,
      amount: Number(data.amount),
      timestamp: data.timestamp
    });
  } catch (error: any) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: error.message, message: '更新记录失败' });
  }
});

// GET /api/guests
app.get('/api/guests', async (req, res) => {
  const { data, error } = await supabase.from('guests').select('*');
  if (error) return res.status(500).json({ error: error.message, message: '获取宾客失败' });

  res.json(data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] API running on http://localhost:${PORT}`);
});
