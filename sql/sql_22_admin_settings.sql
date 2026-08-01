-- =====================================================================
-- SQL 22: CREATE ADMIN_SETTINGS TABLE & RLS POLICIES FOR TELEGRAM TOGGLES
-- =====================================================================

-- 1. Create admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key VARCHAR(255) PRIMARY KEY,
    value BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable Row Level Security
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to allow clean recreation
DROP POLICY IF EXISTS "Allow read admin_settings to public" ON public.admin_settings;
DROP POLICY IF EXISTS "Allow write admin_settings to admins" ON public.admin_settings;
DROP POLICY IF EXISTS "Allow select admin_settings to all" ON public.admin_settings;
DROP POLICY IF EXISTS "Allow upsert admin_settings to admin users" ON public.admin_settings;

-- 4. Create SELECT policy: Everyone (or authenticated) can read settings
CREATE POLICY "Allow select admin_settings to all" ON public.admin_settings
    FOR SELECT TO public
    USING ( true );

-- 5. Create INSERT / UPDATE policies for admin users
CREATE POLICY "Allow upsert admin_settings to admin users" ON public.admin_settings
    FOR ALL TO authenticated
    USING ( public.is_admin() )
    WITH CHECK ( public.is_admin() );

-- 6. Insert default settings if they do not exist
INSERT INTO public.admin_settings (key, value) VALUES
    ('telegram_alert_confirm', true),
    ('telegram_daily_briefing', true),
    ('telegram_alert_general_inquiry', true),
    ('telegram_alert_component_inquiry', true),
    ('telegram_alert_cancellation', true)
ON CONFLICT (key) DO NOTHING;
