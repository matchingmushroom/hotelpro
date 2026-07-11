-- Bar orders table for tracking bar/restaurant beverage charges
CREATE TABLE IF NOT EXISTS bar_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  room_number TEXT,
  guest_name TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE bar_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON bar_orders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all for anon" ON bar_orders
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
