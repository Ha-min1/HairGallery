-- =====================================================================
-- SQL 21: FIX PUBLIC.IS_ADMIN() CASE SENSITIVITY AND RESERVATIONS RLS
-- =====================================================================

-- 1. is_admin() function with case-insensitive role & is_admin column check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND (
        UPPER(role::text) = 'ADMIN'
        OR is_admin = true
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. reservations RLS policy re-definition
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reservations select policy" ON public.reservations;
DROP POLICY IF EXISTS "Reservations read public" ON public.reservations;
DROP POLICY IF EXISTS "Admin select all reservations" ON public.reservations;

-- Allow authenticated users to read their own reservations or admins to read all reservations
CREATE POLICY "Reservations select policy" ON public.reservations
    FOR SELECT TO authenticated
    USING ( (auth.uid() = user_id) OR public.is_admin() );

-- Allow public access to view reservation slots for calendar availability
CREATE POLICY "Reservations read public" ON public.reservations
    FOR SELECT TO public
    USING ( true );
