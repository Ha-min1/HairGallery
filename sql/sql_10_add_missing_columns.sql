-- 1. Add missing work_menu column to public.users table (solves schema cache error for customers)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS work_menu VARCHAR(255);

-- 2. Add display_order column to public.services table (enables menu sorting)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
