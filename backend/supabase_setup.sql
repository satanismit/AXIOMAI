-- ══════════════════════════════════════════════════════════════════
--  AXIOMAI / PaperMind AI — Supabase Setup SQL
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════════

-- 1. User profiles table (mirrors auth.users, one-to-one)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name         text,
    subscription_plan text        NOT NULL DEFAULT 'free',
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- 2. Row Level Security — users can only see/edit their own row
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- 3. Auto-insert profile row whenever a new user signs up
--    Picks up full_name from raw_user_meta_data set during signUp()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name'
    )
    ON CONFLICT (id) DO NOTHING;   -- idempotent: safe to re-run
    RETURN NEW;
END;
$$;

-- Drop and recreate trigger so this script is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();
