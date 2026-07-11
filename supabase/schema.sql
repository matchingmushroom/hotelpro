-- HotelPro Database Schema for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HOTELS
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Hotel',
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'NPR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'receptionist', 'housekeeping', 'housekeeping_manager', 'food_staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROOMS
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'twin', 'suite', 'deluxe', 'penthouse')),
  floor INTEGER DEFAULT 1,
  price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0,
  capacity INTEGER DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'out_of_order')),
  amenities TEXT[] DEFAULT '{}',
  description TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, room_number)
);

-- 4. GUESTS
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  id_card_front TEXT,
  id_card_back TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  group_id UUID,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
  booking_type TEXT NOT NULL DEFAULT 'regular' CHECK (booking_type IN ('regular', 'group', 'walk_in')),
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  special_requests TEXT,
  total_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GROUP BOOKINGS
CREATE TABLE group_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  contact_phone TEXT,
  total_rooms INTEGER DEFAULT 1,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WAITLIST
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_email TEXT,
  preferred_room_type TEXT,
  check_in_date DATE,
  check_out_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MENU ITEMS
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('veg', 'non_veg', 'beverages', 'desserts', 'snacks')),
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FOOD ORDERS
CREATE TABLE food_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  room_number TEXT,
  guest_name TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CLEANING REQUESTS
CREATE TABLE cleaning_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STAFF ASSIGNMENTS
CREATE TABLE staff_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('cleaning', 'maintenance', 'checkout_cleaning')),
  assignment_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. QUOTES
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PAYMENT METHODS
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'card', 'bank_transfer', 'online', 'mobile_banking')),
  details TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  reference TEXT,
  screenshot_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. ACTIVITY LOGS
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_dates ON bookings(hotel_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(hotel_id, status);
CREATE INDEX idx_rooms_status ON rooms(hotel_id, status);
CREATE INDEX idx_food_orders_status ON food_orders(hotel_id, status);
CREATE INDEX idx_cleaning_status ON cleaning_requests(hotel_id, status);
CREATE INDEX idx_invoices_status ON invoices(hotel_id, status);
CREATE INDEX idx_activity_logs_hotel ON activity_logs(hotel_id, created_at DESC);
CREATE INDEX idx_profiles_role ON profiles(hotel_id, role);

-- RLS: Enable row-level security on all tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Hotel isolation
CREATE POLICY hotel_isolation ON hotels
  USING (id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON rooms
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON guests
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON bookings
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON group_bookings
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON waitlist
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON menu_items
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON food_orders
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON cleaning_requests
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON staff_assignments
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON quotes
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON invoices
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON payment_methods
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON payments
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY hotel_isolation ON activity_logs
  USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

-- Profile read policy (everyone can see profiles in their hotel)
CREATE POLICY profile_read ON profiles
  FOR SELECT USING (hotel_id = (SELECT hotel_id FROM profiles WHERE id = auth.uid()));

-- Admin-only write policies
CREATE POLICY admin_write_rooms ON rooms
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY admin_write_guests ON guests
  FOR INSERT WITH CHECK (true);  -- All staff can add guests

CREATE POLICY admin_write_menu ON menu_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'food_staff'))
  );
