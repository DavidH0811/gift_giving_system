-- 礼物赠送系统 Supabase 初始化脚本
-- 请在 Supabase 的 SQL Editor 中运行此脚本

-- 1. 开启 UUID 扩展（默认通常已开启）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建 activities 表
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 gift_records 表
CREATE TABLE IF NOT EXISTS gift_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  activity_title TEXT NOT NULL,
  giver_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建 guests 表
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);
