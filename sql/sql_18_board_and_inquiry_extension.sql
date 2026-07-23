-- Migration: sql_18_board_and_inquiry_extension.sql
-- Date: 2026-07-23
-- Purpose: 
-- 1. Extend `component_inquiries` table schema, status defaults, reply fields and RLS policies.
-- 2. Create `public.posts` table with pin/pin_order, image_url, indexes and RLS policies.

-- ============================================================================
-- 1. Extend public.component_inquiries Table & RLS Policies
-- ============================================================================

-- Add new columns if they do not exist
ALTER TABLE public.component_inquiries
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS reply_content TEXT,
    ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- Update status default to 'pending'
ALTER TABLE public.component_inquiries 
    ALTER COLUMN status SET DEFAULT 'pending';

-- Migrate legacy status values & reply fields if present
UPDATE public.component_inquiries 
SET status = 'pending' 
WHERE status = 'OPEN' OR status IS NULL;

UPDATE public.component_inquiries 
SET status = 'replied' 
WHERE status = 'RESOLVED';

UPDATE public.component_inquiries 
SET reply_content = admin_reply 
WHERE reply_content IS NULL AND admin_reply IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.component_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop old policies to prevent policy conflicts
DROP POLICY IF EXISTS "Anyone can insert component inquiries" ON public.component_inquiries;
DROP POLICY IF EXISTS "Admins can view component inquiries" ON public.component_inquiries;
DROP POLICY IF EXISTS "Admins can update component inquiries" ON public.component_inquiries;
DROP POLICY IF EXISTS "Admins can delete component inquiries" ON public.component_inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries or admin views all" ON public.component_inquiries;
DROP POLICY IF EXISTS "Service role full access on component inquiries" ON public.component_inquiries;

-- RLS Policy 1: INSERT - TO public (anyone, including unauthenticated guests can insert)
CREATE POLICY "Anyone can insert component inquiries" ON public.component_inquiries
    FOR INSERT TO public
    WITH CHECK ( true );

-- RLS Policy 2: SELECT - Logged-in user can view their own inquiries (user_id = auth.uid()), Admin can view all
CREATE POLICY "Users can view own inquiries or admin views all" ON public.component_inquiries
    FOR SELECT TO public
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.is_admin()
    );

-- RLS Policy 3: UPDATE - ONLY Admins can update inquiries (write replies, change status)
CREATE POLICY "Admins can update component inquiries" ON public.component_inquiries
    FOR UPDATE TO authenticated
    USING ( public.is_admin() )
    WITH CHECK ( public.is_admin() );

-- RLS Policy 4: DELETE - ONLY Admins can delete inquiries
CREATE POLICY "Admins can delete component inquiries" ON public.component_inquiries
    FOR DELETE TO authenticated
    USING ( public.is_admin() );


-- ============================================================================
-- 2. Create public.posts Table, Indexes & RLS Policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT false,
    pin_order INT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Indexes for fast sorting by pin status, pin order, created_at, and author
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pin_order ON public.posts(pin_order ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop old policies on posts table
DROP POLICY IF EXISTS "Authenticated users can select posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users insert posts policy" ON public.posts;
DROP POLICY IF EXISTS "Authors or Admins update posts policy" ON public.posts;
DROP POLICY IF EXISTS "Authors or Admins delete posts policy" ON public.posts;

-- RLS Policy 1: SELECT - TO authenticated (Only logged-in users can view posts)
CREATE POLICY "Authenticated users can select posts" ON public.posts
    FOR SELECT TO authenticated
    USING ( true );

-- RLS Policy 2: INSERT - TO authenticated
-- Non-admin logged-in users can insert standard posts (image_url IS NULL, is_pinned IS NOT TRUE, pin_order IS NULL).
-- Admins can insert posts with image_url, is_pinned, and pin_order.
CREATE POLICY "Authenticated users insert posts policy" ON public.posts
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.uid() = author_id) AND (
            public.is_admin() OR (image_url IS NULL AND is_pinned IS NOT TRUE AND pin_order IS NULL)
        )
    );

-- RLS Policy 3: UPDATE - Author can update own post (non-admin author cannot set image_url/is_pinned/pin_order), Admin can update any post
CREATE POLICY "Authors or Admins update posts policy" ON public.posts
    FOR UPDATE TO authenticated
    USING (
        (auth.uid() = author_id) OR public.is_admin()
    )
    WITH CHECK (
        public.is_admin() OR (
            auth.uid() = author_id AND (image_url IS NULL) AND (is_pinned IS NOT TRUE) AND (pin_order IS NULL)
        )
    );

-- RLS Policy 4: DELETE - Author or Admin can delete posts
CREATE POLICY "Authors or Admins delete posts policy" ON public.posts
    FOR DELETE TO authenticated
    USING (
        (auth.uid() = author_id) OR public.is_admin()
    );
