-- 1. Create is_admin() security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop old policies on users table
DROP POLICY IF EXISTS "Users can read own row" ON users;
DROP POLICY IF EXISTS "Users can update own row" ON users;
DROP POLICY IF EXISTS "Users can insert own row" ON users;
DROP POLICY IF EXISTS "Select users policy" ON users;
DROP POLICY IF EXISTS "Insert users policy" ON users;
DROP POLICY IF EXISTS "Update users policy" ON users;
DROP POLICY IF EXISTS "Delete users policy" ON users;

-- 3. Recreate policies for users table using is_admin()
CREATE POLICY "Select users policy" ON users FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
);

CREATE POLICY "Insert users policy" ON users FOR INSERT WITH CHECK (
    auth.uid() = id OR public.is_admin()
);

CREATE POLICY "Update users policy" ON users FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
) WITH CHECK (
    auth.uid() = id OR public.is_admin()
);

CREATE POLICY "Delete users policy" ON users FOR DELETE USING (
    public.is_admin()
);

-- 4. Drop old policies on services table
DROP POLICY IF EXISTS "Services read public" ON services;
DROP POLICY IF EXISTS "Admins can insert services" ON services;
DROP POLICY IF EXISTS "Admins can update services" ON services;
DROP POLICY IF EXISTS "Admins can delete services" ON services;

-- 5. Recreate policies for services table using is_admin()
CREATE POLICY "Services read public" ON services FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert services" ON services FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update services" ON services FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete services" ON services FOR DELETE TO authenticated
USING (public.is_admin());

-- 6. Drop old policies on work_records table
DROP POLICY IF EXISTS "Admins can select work_records" ON work_records;
DROP POLICY IF EXISTS "Admins can insert work_records" ON work_records;
DROP POLICY IF EXISTS "Admins can update work_records" ON work_records;
DROP POLICY IF EXISTS "Admins can delete work_records" ON work_records;

-- 7. Recreate policies for work_records table using is_admin()
CREATE POLICY "Admins can select work_records" ON work_records FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert work_records" ON work_records FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update work_records" ON work_records FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete work_records" ON work_records FOR DELETE TO authenticated USING (public.is_admin());
