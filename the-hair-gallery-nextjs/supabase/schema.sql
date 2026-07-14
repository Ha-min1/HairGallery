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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create 'service_menus' table
CREATE TABLE service_menus (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL, -- "Cut", "Color", "Treatment", "Styling"
    description TEXT
);

-- 5. Create 'reservations' table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    service_id VARCHAR(50) REFERENCES service_menus(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL, -- "09:00", "18:00" etc.
    status reservation_status DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add Performance Indexes for slot lookup validator searches
CREATE INDEX idx_reservations_date_time ON reservations(date, time);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);

-- 7. Seed Initial Service Registry (The Price List)
INSERT INTO service_menus (id, name, price, duration_minutes, category, description) VALUES
('s1', 'Signature Cut & Blowout', 90.00, 60, 'Cut', 'A bespoke cutting experience tailored to your facial structure, complete with a luxury wash and bouncy signature blowout.'),
('s2', 'Gents Precision Cut', 55.00, 45, 'Cut', 'Clean scissor-and-clipper work, detailed texturizing, hot towel neck shave, and premium matte clay styling.'),
('s3', 'Balayage Artistry', 240.00, 180, 'Color', 'Hand-painted premium sun-kissed highlights creating seamless, low-maintenance dimensional transitions.'),
('s4', 'Full Dimensional Color', 170.00, 120, 'Color', 'All-over bespoke glossing, toning, and depth-building color treatment using ammonia-free formulas.'),
('s5', 'Root Touch-up', 95.00, 75, 'Color', 'Precise coverage of gray growth or root matching, complete with a restorative protein glaze.'),
('s6', 'Keratin Smooth Treatment', 280.00, 150, 'Treatment', 'Formaldehyde-free smoothing therapy that eliminates frizz, blocks humidity, and cuts style time in half.'),
('s7', 'Caviar Deep Conditioning', 80.00, 45, 'Treatment', 'Intense micro-emulsion moisture therapy with black caviar extract to restore lipid protection and high shine.'),
('s8', 'Red Carpet Blowout & Style', 75.00, 45, 'Styling', 'Premium red-carpet styling with thermal round-brush sculpting, high-gloss finish, and pin-set volume.');

-- 8. Enable Row Level Security (RLS) on Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_menus ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies
-- Users: Let authenticated guests view and update their own record, let admins see everything
CREATE POLICY "Users can read own row" ON users FOR SELECT USING (auth.uid() = id OR role = 'ADMIN');
CREATE POLICY "Users can update own row" ON users FOR UPDATE USING (auth.uid() = id);

-- Service Menus: Public read-only access
CREATE POLICY "Service menus read public" ON service_menus FOR SELECT TO public USING (true);

-- Reservations: Guests can read and insert their own reservations; Admins can do anything
CREATE POLICY "Users read own reservations" ON reservations FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Users create reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update/cancel own pending reservations" ON reservations FOR UPDATE USING (auth.uid() = user_id AND status = 'Pending');
