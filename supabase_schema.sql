-- CarbonWise Supabase Schema Setup Script
-- Run this in your Supabase SQL Editor (https://supabase.com) to initialize all tables.

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    city TEXT,
    household_size INTEGER DEFAULT 1,
    avatar_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create footprint_reports table
CREATE TABLE IF NOT EXISTS public.footprint_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    total_co2e NUMERIC NOT NULL,
    transport_co2e NUMERIC NOT NULL,
    energy_co2e NUMERIC NOT NULL,
    food_co2e NUMERIC NOT NULL,
    lifestyle_co2e NUMERIC NOT NULL,
    input_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES public.footprint_reports(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    activity TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    co2e NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    estimated_saving NUMERIC DEFAULT 0 NOT NULL,
    difficulty TEXT DEFAULT 'easy' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    source TEXT,
    recommendation_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    condition_key TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES public.footprint_reports(id) ON DELETE CASCADE NOT NULL,
    summary TEXT NOT NULL,
    recommendations JSONB NOT NULL,
    impact_level TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footprint_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid duplication
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.footprint_reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.footprint_reports;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
DROP POLICY IF EXISTS "Users can view their own earned badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert their own earned badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON public.ai_insights;

-- Create Policies
-- Profiles: viewable by anyone (needed for leaderboard), insert/update by owner
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Footprint Reports: select/insert by owner
CREATE POLICY "Users can view their own reports" ON public.footprint_reports
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reports" ON public.footprint_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Activities: select/insert by owner
CREATE POLICY "Users can view their own activities" ON public.user_activities
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities" ON public.user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Goals: select/insert/update by owner
CREATE POLICY "Users can view their own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

-- Badges: viewable by anyone
CREATE POLICY "Badges are viewable by everyone" ON public.badges
    FOR SELECT USING (true);

-- User Badges: select/insert by owner
CREATE POLICY "Users can view their own earned badges" ON public.user_badges
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own earned badges" ON public.user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Insights: select/insert by owner
CREATE POLICY "Users can view their own insights" ON public.ai_insights
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own insights" ON public.ai_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed badges
INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('First Report', 'Complete first footprint calculation', '🥇', 'first_report', 'general')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('Carbon Starter', 'Accept first reduction goal', '🌱', 'carbon_starter', 'general')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('Action Taker', 'Complete first goal', '✅', 'action_taker', 'general')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('10% Reducer', 'Reduce footprint by 10% from previous', '📉', '10_percent_reducer', 'general')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('Transport Saver', 'Complete a transport goal', '🚲', 'transport_saver', 'transport')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('Food Hero', 'Complete a food goal', '🥗', 'food_hero', 'food')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('Energy Saver', 'Complete an energy goal', '💡', 'energy_saver', 'energy')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('Eco Shopper', 'Complete a lifestyle goal', '🛍️', 'lifestyle_saver', 'lifestyle')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('Simulator Pro', 'Use the simulator 3 times', '🧪', 'simulator_pro', 'general')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

INSERT INTO public.badges (name, description, icon, condition_key, category) VALUES
('Goal Crusher', 'Complete 5 goals', '🏆', 'goal_crusher', 'general')
ON CONFLICT (condition_key) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, category = EXCLUDED.category;

-- Profile trigger to create profile record when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, banner_url, household_size)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    NULL,
    1
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
