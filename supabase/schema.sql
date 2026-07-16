-- =====================================================================
-- THE HAIR GALLERY - POSTGRESQL / SUPABASE DATABASE SCHEMAS
-- =====================================================================

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define custom type structures
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE reservation_status AS ENUM ('Pending', 'Confirmed', 'Completed', 'Cancelled');

-- 3. Create 'users' table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'USER',
    phone VARCHAR(50),
    provider VARCHAR(50) NOT NULL DEFAULT 'credentials', -- "credentials" or "google"
    mobile_optimized BOOLEAN DEFAULT TRUE,
    price INTEGER,
    work_menu VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create 'services' table (8,000 KRW to 15,000 KRW pricing)
CREATE TABLE services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER, -- Stored in KRW (e.g. 10000, can be NULL for custom mockup)
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create 'reservations' table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    service_id VARCHAR(50) REFERENCES services(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL, -- "09:00", "14:00" etc.
    status reservation_status DEFAULT 'Pending',
    price INTEGER, -- Custom overriding price for the reservation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add Performance Indexes
CREATE INDEX idx_reservations_date_time ON reservations(date, time);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);

-- 7. DOUBLE-BOOKING PREVENTION CONSTRAINT (Database-Level Guarantee)
-- A partial unique index ensures that no two active reservations can share the same date and time slot.
-- If a reservation is 'Cancelled', it is excluded from the unique constraint, freeing up the slot.
CREATE UNIQUE INDEX idx_reservations_prevent_double_booking
ON reservations (date, time)
WHERE (status <> 'Cancelled');

-- 8. Seed Initial Service Registry (KRW Price List: 8,000 to 15,000 KRW)
INSERT INTO services (id, name, price, duration_minutes, description) VALUES
('s1', 'Signature Cut & Blowout', 15000, 60, 'A bespoke cutting experience tailored to your facial structure, complete with a luxury wash and bouncy signature blowout.'),
('s2', 'Gents Precision Cut', 10000, 45, 'Clean scissor-and-clipper work, detailed texturizing, hot towel neck shave, and premium styling.'),
('s3', 'Quick Trim & Clean-up', 8000, 30, 'A fast touch-up for split ends or bangs to keep your current cut looking fresh.'),
('s4', 'Balayage Color Touch', 13000, 120, 'Hand-painted highlights creating seamless, low-maintenance dimensional transitions.'),
('s5', 'Root Touch-up Gloss', 11000, 75, 'Precise coverage of root growth or gray hair, complete with a restorative protein glaze.'),
('s6', 'Scalp Therapy & Treatment', 12000, 60, 'Intense micro-emulsion moisture therapy to restore lipid protection and high shine.'),
('s7', 'Red Carpet Blowout & Style', 9000, 45, 'Premium styling with thermal round-brush sculpting, high-gloss finish, and pin-set volume.');

-- 9. Enable Row Level Security (RLS) on Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 10. Row Level Security Policies

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

-- Users can read their own row, admins can read any row
CREATE POLICY "Select users policy" ON users FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
);

-- Users can insert their own row, admins can insert any row
CREATE POLICY "Insert users policy" ON users FOR INSERT WITH CHECK (
    auth.uid() = id OR public.is_admin()
);

-- Users can update their own row, admins can update any row
CREATE POLICY "Update users policy" ON users FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
) WITH CHECK (
    auth.uid() = id OR public.is_admin()
);

-- Only admins can delete user rows
CREATE POLICY "Delete users policy" ON users FOR DELETE USING (
    public.is_admin()
);

-- Services policies:
-- Anyone can view services
DROP POLICY IF EXISTS "Services read public" ON services;
CREATE POLICY "Services read public" ON services FOR SELECT TO public USING (true);

-- Authenticated admins can insert new services
DROP POLICY IF EXISTS "Admins can insert services" ON services;
CREATE POLICY "Admins can insert services" ON services FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Authenticated admins can update services
DROP POLICY IF EXISTS "Admins can update services" ON services;
CREATE POLICY "Admins can update services" ON services FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Authenticated admins can delete services
DROP POLICY IF EXISTS "Admins can delete services" ON services;
CREATE POLICY "Admins can delete services" ON services FOR DELETE TO authenticated
USING (public.is_admin());

-- Reservations policies:
-- Anyone can view reservations to check slot availability (necessary for the calendar to display disabled/booked slots)
CREATE POLICY "Reservations read public" ON reservations FOR SELECT TO public USING (true);

-- Anyone can insert a reservation (guests booking on the website)
CREATE POLICY "Reservations insert public" ON reservations FOR INSERT WITH CHECK (true);

-- Users can update/cancel their own reservations if they are signed in (or we can let users manage their own if they have their user_id set)
CREATE POLICY "Users update own reservations" ON reservations FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================================
-- 11. Create 'work_records' table (Admin Work & Sales Management)
-- =====================================================================
CREATE TABLE work_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    work_content TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for search performance
CREATE INDEX idx_work_records_search ON work_records (customer_name, customer_phone);
-- Indexing for date sorting & range queries
CREATE INDEX idx_work_records_date ON work_records (date ASC);

-- Enable Row Level Security (RLS) on work_records
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

-- Create policies: Only users with role = 'ADMIN' in 'users' table can perform CRUD operations
CREATE POLICY "Admins can select work_records" 
ON work_records FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);

CREATE POLICY "Admins can insert work_records" 
ON work_records FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);

CREATE POLICY "Admins can update work_records" 
ON work_records FOR UPDATE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);

CREATE POLICY "Admins can delete work_records" 
ON work_records FOR DELETE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);
