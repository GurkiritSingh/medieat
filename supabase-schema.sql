-- ============================================================
-- MediEat — Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. User Profiles (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Health Profiles (conditions, allergies, preferences)
CREATE TABLE health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conditions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    custom_allergies TEXT[] DEFAULT '{}',
    favorite_foods TEXT[] DEFAULT '{}',
    diet_preference TEXT DEFAULT 'any',
    calorie_target INTEGER DEFAULT 2000,
    meal_count INTEGER DEFAULT 4,
    cuisines TEXT[] DEFAULT '{}',
    macro_targets JSONB DEFAULT '{"protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sodium": 0}',
    macro_goals TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Meal Plans (generated plans)
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Untitled Plan',
    duration_days INTEGER DEFAULT 7,
    plan_data JSONB NOT NULL,
    conditions TEXT[] DEFAULT '{}',
    calorie_target INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Saved Meals (bookmarked individual meals)
CREATE TABLE saved_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    meal_name TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    meal_data JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Grocery Lists
CREATE TABLE grocery_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) — users can only access their own data
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Health Profiles
CREATE POLICY "Users can view own health profile"
    ON health_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health profile"
    ON health_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health profile"
    ON health_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health profile"
    ON health_profiles FOR DELETE USING (auth.uid() = user_id);

-- Meal Plans
CREATE POLICY "Users can view own meal plans"
    ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans"
    ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans"
    ON meal_plans FOR DELETE USING (auth.uid() = user_id);

-- Saved Meals
CREATE POLICY "Users can view own saved meals"
    ON saved_meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved meals"
    ON saved_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved meals"
    ON saved_meals FOR DELETE USING (auth.uid() = user_id);

-- Grocery Lists
CREATE POLICY "Users can view own grocery lists"
    ON grocery_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grocery lists"
    ON grocery_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grocery lists"
    ON grocery_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grocery lists"
    ON grocery_lists FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Indexes for performance
-- ============================================================

CREATE INDEX idx_health_profiles_user ON health_profiles(user_id);
CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_created ON meal_plans(created_at DESC);
CREATE INDEX idx_saved_meals_user ON saved_meals(user_id);
CREATE INDEX idx_grocery_lists_user ON grocery_lists(user_id);
