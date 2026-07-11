-- Otel.Pro Seed Data — Busy Hotel Simulation
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Demo hotel
INSERT INTO hotels (id, name, address, phone, email, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 'Otel.Pro Grand', 'City Center, Main Street', '+977-1-4XXXXXX', 'info@otelpro.com', 'NPR')
ON CONFLICT (id) DO NOTHING;

-- 2. Create profiles after adding auth users in Supabase UI:
-- Authentication > Users > Add User:
--   admin@otelpro.com / admin123
--   reception@otelpro.com / reception123
--   housekeeping@otelpro.com / hk123
--   food@otelpro.com / food123
-- Then run (replace UUIDs with actual user IDs from the Users table):
-- INSERT INTO profiles (id, hotel_id, name, phone, role) VALUES
-- ('<admin_uuid>', '00000000-0000-0000-0000-000000000001', 'Admin User', '+977-9800000001', 'admin'),
-- ('<reception_uuid>', '00000000-0000-0000-0000-000000000001', 'Receptionist', '+977-9800000002', 'receptionist'),
-- ('<hk_uuid>', '00000000-0000-0000-0000-000000000001', 'Housekeeping Staff', '+977-9800000003', 'housekeeping'),
-- ('<food_uuid>', '00000000-0000-0000-0000-000000000001', 'Food Staff', '+977-9800000004', 'food_staff');

-- 3. Rooms — 24 rooms with fixed UUIDs
INSERT INTO rooms (id, hotel_id, room_number, room_type, floor, price_per_night, capacity, status, amenities, description) VALUES
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '101', 'single', 1, 2500, 1, 'cleaning', ARRAY['wifi','tv','ac'], 'Cozy single room with city view'),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '102', 'single', 1, 2500, 1, 'occupied', ARRAY['wifi','tv','ac'], 'Standard single room'),
('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '103', 'single', 1, 2800, 1, 'occupied', ARRAY['wifi','tv','ac','balcony'], 'Single room with garden access'),
('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', '104', 'single', 1, 2200, 1, 'available', ARRAY['wifi','tv'], 'Budget-friendly single room'),
('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', '105', 'single', 1, 2500, 1, 'available', ARRAY['wifi','tv','ac'], 'Standard single room'),
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', '201', 'double', 2, 4000, 2, 'occupied', ARRAY['wifi','tv','ac','minibar'], 'Spacious double room with queen bed'),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', '202', 'double', 2, 4500, 2, 'occupied', ARRAY['wifi','tv','ac','minibar','balcony'], 'Double room with private balcony'),
('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', '203', 'double', 2, 4200, 2, 'available', ARRAY['wifi','tv','ac','minibar'], 'Double room city view'),
('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', '204', 'double', 2, 4000, 2, 'cleaning', ARRAY['wifi','tv','ac','minibar'], 'Double room with street view'),
('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000001', '205', 'double', 2, 4800, 2, 'occupied', ARRAY['wifi','tv','ac','minibar','balcony','bathtub'], 'Premium double room'),
('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', '301', 'twin', 3, 5000, 2, 'available', ARRAY['wifi','tv','ac','minibar'], 'Twin room with two single beds'),
('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '302', 'twin', 3, 5000, 2, 'occupied', ARRAY['wifi','tv','ac','minibar'], 'Twin room with garden view'),
('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', '303', 'twin', 3, 5500, 2, 'available', ARRAY['wifi','tv','ac','minibar','balcony'], 'Twin room with mountain view'),
('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000001', '304', 'twin', 3, 5200, 2, 'occupied', ARRAY['wifi','tv','ac','minibar'], 'Twin deluxe'),
('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000001', '305', 'twin', 3, 5000, 2, 'occupied', ARRAY['wifi','tv','ac','minibar'], 'Standard twin room'),
('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000001', '401', 'suite', 4, 8000, 3, 'occupied', ARRAY['wifi','tv','ac','minibar','living_area','bathtub'], 'Premium suite with living room'),
('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000001', '402', 'suite', 4, 9000, 3, 'occupied', ARRAY['wifi','tv','ac','minibar','living_area','bathtub','balcony'], 'Executive suite with panoramic view'),
('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000001', '403', 'suite', 4, 8500, 3, 'available', ARRAY['wifi','tv','ac','minibar','living_area','bathtub'], 'Junior suite'),
('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000001', '404', 'suite', 4, 9500, 4, 'available', ARRAY['wifi','tv','ac','minibar','living_area','bathtub','balcony','kitchenette'], 'Family suite'),
('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000001', '405', 'suite', 4, 10000, 4, 'maintenance', ARRAY['wifi','tv','ac','minibar','living_area','bathtub','balcony'], 'Suite under renovation'),
('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000001', '501', 'deluxe', 5, 12000, 4, 'available', ARRAY['wifi','tv','ac','minibar','living_area','bathtub','balcony','kitchenette'], 'Top-floor deluxe apartment'),
('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000001', '502', 'deluxe', 5, 15000, 4, 'occupied', ARRAY['wifi','tv','ac','minibar','living_area','bathtub','balcony','kitchenette'], 'Presidential suite'),
('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000001', '503', 'deluxe', 5, 13000, 3, 'available', ARRAY['wifi','tv','ac','minibar','living_area','bathtub','balcony'], 'Deluxe corner suite'),
('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000001', '504', 'deluxe', 5, 20000, 6, 'available', ARRAY['wifi','tv','ac','minibar','living_area','bathtub','balcony','kitchenette','dining'], 'Penthouse')
ON CONFLICT (hotel_id, room_number) DO UPDATE SET status = EXCLUDED.status, price_per_night = EXCLUDED.price_per_night, amenities = EXCLUDED.amenities, description = EXCLUDED.description;

-- 4. Guests — 20 guests
INSERT INTO guests (id, hotel_id, name, email, phone, address) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Ram Sharma', 'ram@email.com', '+977-9812340001', 'Kathmandu'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Sita Poudel', 'sita@email.com', '+977-9845670001', 'Pokhara'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'John Doe', 'john@email.com', '+977-9801230001', 'Lalitpur'),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Jane Smith', 'jane@email.com', '+977-9856780001', 'Biratnagar'),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Binod Rai', 'binod@email.com', '+977-9865430001', 'Dharan'),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Gita Gurung', 'gita@email.com', '+977-9876540001', 'Chitwan'),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Mike Johnson', 'mike@email.com', '+977-9812340002', 'Kathmandu'),
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Anita Thapa', 'anita@email.com', '+977-9845670002', 'Butwal'),
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'David Brown', 'david@email.com', '+977-9801230002', 'Kathmandu'),
('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'Sunita Lama', 'sunita@email.com', '+977-9856780002', 'Janakpur'),
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Rajesh Hamal', 'rajesh@email.com', '+977-9865430002', 'Kathmandu'),
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Emily Clark', 'emily@email.com', '+977-9876540002', 'Pokhara'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Krishna Shah', 'krishna@email.com', '+977-9812340003', 'Nepalgunj'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Maya Devi', 'maya@email.com', '+977-9845670003', 'Bhaktapur'),
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'Tom Wilson', 'tom@email.com', '+977-9801230003', 'Kathmandu'),
('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'Prakash Adhikari', 'prakash@email.com', '+977-9856780003', 'Bharatpur'),
('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'Sarah Lee', 'sarah@email.com', '+977-9865430003', 'Lalitpur'),
('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'Hari Bhandari', 'hari@email.com', '+977-9876540003', 'Baglung'),
('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'Nina Joshi', 'nina@email.com', '+977-9812340004', 'Kathmandu'),
('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'Alex Turner', 'alex@email.com', '+977-9845670004', 'Pokhara')
ON CONFLICT (id) DO NOTHING;

-- 5. Bookings — 37 bookings using fixed room UUIDs
INSERT INTO bookings (id, hotel_id, guest_id, room_id, check_in_date, check_out_date, status, booking_type, adults, children, total_amount, created_at) VALUES
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000102', CURRENT_DATE - 3, CURRENT_DATE + 2, 'checked_in', 'regular', 1, 0, 12500, CURRENT_DATE - 5),
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000103', CURRENT_DATE - 2, CURRENT_DATE + 1, 'checked_in', 'regular', 1, 0, 8400, CURRENT_DATE - 4),
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000201', CURRENT_DATE - 1, CURRENT_DATE + 3, 'checked_in', 'regular', 2, 1, 16000, CURRENT_DATE - 3),
('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000202', CURRENT_DATE - 2, CURRENT_DATE + 2, 'checked_in', 'walk_in', 2, 0, 18000, CURRENT_DATE - 2),
('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000205', CURRENT_DATE - 1, CURRENT_DATE + 4, 'checked_in', 'regular', 2, 0, 24000, CURRENT_DATE - 3),
('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000302', CURRENT_DATE - 4, CURRENT_DATE + 1, 'checked_in', 'regular', 2, 0, 25000, CURRENT_DATE - 6),
('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000304', CURRENT_DATE - 1, CURRENT_DATE + 2, 'checked_in', 'regular', 2, 1, 15600, CURRENT_DATE - 3),
('00000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000305', CURRENT_DATE - 2, CURRENT_DATE + 1, 'checked_in', 'group', 2, 0, 15000, CURRENT_DATE - 4),
('00000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000401', CURRENT_DATE - 3, CURRENT_DATE, 'checked_in', 'regular', 1, 0, 24000, CURRENT_DATE - 7),
('00000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000502', CURRENT_DATE - 2, CURRENT_DATE + 3, 'checked_in', 'regular', 3, 0, 75000, CURRENT_DATE - 5),
('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', NULL, CURRENT_DATE + 1, CURRENT_DATE + 4, 'confirmed', 'regular', 2, 0, 12000, CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', NULL, CURRENT_DATE + 2, CURRENT_DATE + 5, 'confirmed', 'walk_in', 1, 0, 15000, CURRENT_DATE),
('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022', NULL, CURRENT_DATE + 3, CURRENT_DATE + 7, 'confirmed', 'regular', 2, 2, 20000, CURRENT_DATE),
('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', NULL, CURRENT_DATE + 5, CURRENT_DATE + 8, 'confirmed', 'regular', 2, 0, 13500, CURRENT_DATE + 1),
('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000024', NULL, CURRENT_DATE + 7, CURRENT_DATE + 10, 'confirmed', 'regular', 1, 0, 36000, CURRENT_DATE + 1),
('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000025', NULL, CURRENT_DATE + 10, CURRENT_DATE + 14, 'confirmed', 'group', 4, 2, 52000, CURRENT_DATE + 2),
('00000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000101', CURRENT_DATE - 6, CURRENT_DATE - 4, 'checked_out', 'regular', 1, 0, 5000, CURRENT_DATE - 10),
('00000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000203', CURRENT_DATE - 5, CURRENT_DATE - 2, 'checked_out', 'regular', 2, 0, 12600, CURRENT_DATE - 8),
('00000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000303', CURRENT_DATE - 7, CURRENT_DATE - 4, 'checked_out', 'regular', 2, 1, 16500, CURRENT_DATE - 12),
('00000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000403', CURRENT_DATE - 8, CURRENT_DATE - 5, 'checked_out', 'regular', 2, 0, 25500, CURRENT_DATE - 14),
('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000301', CURRENT_DATE - 10, CURRENT_DATE - 8, 'checked_out', 'regular', 2, 0, 10000, CURRENT_DATE - 15),
('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000501', CURRENT_DATE - 9, CURRENT_DATE - 6, 'checked_out', 'regular', 2, 0, 36000, CURRENT_DATE - 16),
('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000401', CURRENT_DATE - 12, CURRENT_DATE - 9, 'checked_out', 'regular', 1, 0, 24000, CURRENT_DATE - 18),
('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000202', CURRENT_DATE - 11, CURRENT_DATE - 8, 'checked_out', 'regular', 2, 0, 13500, CURRENT_DATE - 17),
('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000102', CURRENT_DATE - 14, CURRENT_DATE - 12, 'checked_out', 'regular', 1, 0, 5000, CURRENT_DATE - 20),
('00000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000205', CURRENT_DATE - 13, CURRENT_DATE - 10, 'checked_out', 'regular', 2, 1, 14400, CURRENT_DATE - 19),
('00000000-0000-0000-0000-000000000056', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000304', CURRENT_DATE - 15, CURRENT_DATE - 12, 'checked_out', 'regular', 2, 0, 15600, CURRENT_DATE - 22),
('00000000-0000-0000-0000-000000000057', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000201', CURRENT_DATE - 16, CURRENT_DATE - 13, 'checked_out', 'regular', 2, 0, 12000, CURRENT_DATE - 24),
('00000000-0000-0000-0000-000000000058', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000403', CURRENT_DATE - 18, CURRENT_DATE - 15, 'checked_out', 'regular', 2, 0, 25500, CURRENT_DATE - 26),
('00000000-0000-0000-0000-000000000059', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000502', CURRENT_DATE - 20, CURRENT_DATE - 17, 'checked_out', 'regular', 3, 0, 45000, CURRENT_DATE - 28),
('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000103', CURRENT_DATE - 17, CURRENT_DATE - 14, 'checked_out', 'regular', 1, 0, 8400, CURRENT_DATE - 25),
('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000504', CURRENT_DATE - 22, CURRENT_DATE - 18, 'checked_out', 'regular', 4, 2, 80000, CURRENT_DATE - 30),
('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000301', CURRENT_DATE - 19, CURRENT_DATE - 16, 'checked_out', 'regular', 1, 0, 15000, CURRENT_DATE - 27),
('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000204', CURRENT_DATE - 21, CURRENT_DATE - 19, 'checked_out', 'regular', 2, 0, 8000, CURRENT_DATE - 29),
('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000024', NULL, CURRENT_DATE - 3, CURRENT_DATE - 1, 'cancelled', 'regular', 2, 0, 0, CURRENT_DATE - 10),
('00000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000025', NULL, CURRENT_DATE + 8, CURRENT_DATE + 10, 'cancelled', 'regular', 1, 0, 0, CURRENT_DATE - 5),
('00000000-0000-0000-0000-000000000066', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000026', NULL, CURRENT_DATE - 5, CURRENT_DATE - 2, 'cancelled', 'walk_in', 2, 0, 0, CURRENT_DATE - 8)
ON CONFLICT (id) DO NOTHING;

-- 6. Food orders — 15 orders
INSERT INTO food_orders (hotel_id, booking_id, room_number, guest_name, items, total_amount, status, created_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000030', '102', 'Ram Sharma', '[{"description":"Dal Bhat","quantity":2,"unit_price":400,"total":800},{"description":"Nepali Tea","quantity":1,"unit_price":100,"total":100}]', 900, 'delivered', CURRENT_DATE - 2),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000030', '102', 'Ram Sharma', '[{"description":"Chicken Biryani","quantity":1,"unit_price":550,"total":550},{"description":"Gulab Jamun","quantity":2,"unit_price":150,"total":300}]', 850, 'delivered', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000031', '103', 'Sita Poudel', '[{"description":"Vegetable Curry","quantity":1,"unit_price":350,"total":350},{"description":"Fresh Juice","quantity":1,"unit_price":200,"total":200},{"description":"French Fries","quantity":1,"unit_price":180,"total":180}]', 730, 'delivered', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000032', '201', 'John Doe', '[{"description":"Mutton Sekuwa","quantity":2,"unit_price":650,"total":1300},{"description":"Nepali Tea","quantity":2,"unit_price":100,"total":200}]', 1500, 'preparing', CURRENT_DATE),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000032', '201', 'John Doe', '[{"description":"French Fries","quantity":2,"unit_price":180,"total":360},{"description":"Fresh Juice","quantity":2,"unit_price":200,"total":400}]', 760, 'pending', CURRENT_DATE),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000033', '202', 'Jane Smith', '[{"description":"Dal Bhat","quantity":1,"unit_price":400,"total":400},{"description":"Chicken Biryani","quantity":1,"unit_price":550,"total":550}]', 950, 'delivered', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000034', '205', 'Binod Rai', '[{"description":"Gulab Jamun","quantity":3,"unit_price":150,"total":450},{"description":"Nepali Tea","quantity":2,"unit_price":100,"total":200}]', 650, 'preparing', CURRENT_DATE),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000035', '302', 'Gita Gurung', '[{"description":"Mutton Sekuwa","quantity":2,"unit_price":650,"total":1300},{"description":"Dal Bhat","quantity":2,"unit_price":400,"total":800},{"description":"Fresh Juice","quantity":2,"unit_price":200,"total":400}]', 2500, 'delivered', CURRENT_DATE - 2),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000037', '305', 'Anita Thapa', '[{"description":"Chicken Biryani","quantity":2,"unit_price":550,"total":1100},{"description":"Gulab Jamun","quantity":4,"unit_price":150,"total":600}]', 1700, 'delivered', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000038', '401', 'David Brown', '[{"description":"Vegetable Curry","quantity":1,"unit_price":350,"total":350},{"description":"French Fries","quantity":1,"unit_price":180,"total":180}]', 530, 'delivered', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000039', '502', 'Sunita Lama', '[{"description":"Dal Bhat","quantity":3,"unit_price":400,"total":1200},{"description":"Mutton Sekuwa","quantity":2,"unit_price":650,"total":1300},{"description":"Fresh Juice","quantity":3,"unit_price":200,"total":600}]', 3100, 'pending', CURRENT_DATE),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000046', '101', 'Sarah Lee', '[{"description":"Chicken Biryani","quantity":1,"unit_price":550,"total":550}]', 550, 'delivered', CURRENT_DATE - 5),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000048', '303', 'Nina Joshi', '[{"description":"Nepali Tea","quantity":2,"unit_price":100,"total":200},{"description":"Gulab Jamun","quantity":2,"unit_price":150,"total":300}]', 500, 'delivered', CURRENT_DATE - 6),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000045', NULL, 'Prakash Adhikari', '[{"description":"French Fries","quantity":4,"unit_price":180,"total":720},{"description":"Fresh Juice","quantity":4,"unit_price":200,"total":800}]', 1520, 'cancelled', CURRENT_DATE - 3),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000061', '504', 'Emily Clark', '[{"description":"Chicken Biryani","quantity":4,"unit_price":550,"total":2200},{"description":"Mutton Sekuwa","quantity":3,"unit_price":650,"total":1950},{"description":"Gulab Jamun","quantity":6,"unit_price":150,"total":900},{"description":"Fresh Juice","quantity":4,"unit_price":200,"total":800}]', 5850, 'delivered', CURRENT_DATE - 19)
ON CONFLICT DO NOTHING;

-- 7. Menu items — 16 items
INSERT INTO menu_items (hotel_id, name, category, description, price, available) VALUES
('00000000-0000-0000-0000-000000000001', 'Vegetable Curry', 'veg', 'Mixed vegetable curry with steamed rice', 350, true),
('00000000-0000-0000-0000-000000000001', 'Dal Bhat', 'veg', 'Traditional lentil soup with rice and pickles', 400, true),
('00000000-0000-0000-0000-000000000001', 'Paneer Butter Masala', 'veg', 'Cottage cheese in rich tomato gravy with naan', 500, true),
('00000000-0000-0000-0000-000000000001', 'Veg Fried Rice', 'veg', 'Wok-fried rice with seasonal vegetables', 350, true),
('00000000-0000-0000-0000-000000000001', 'Chicken Biryani', 'non_veg', 'Fragrant basmati rice with spiced chicken', 550, true),
('00000000-0000-0000-0000-000000000001', 'Mutton Sekuwa', 'non_veg', 'Grilled marinated mutton pieces with dip', 650, true),
('00000000-0000-0000-0000-000000000001', 'Chilli Chicken', 'non_veg', 'Crispy chicken tossed in spicy soy sauce', 500, true),
('00000000-0000-0000-0000-000000000001', 'Fish Curry', 'non_veg', 'Freshwater fish curry with rice', 600, true),
('00000000-0000-0000-0000-000000000001', 'Nepali Tea', 'beverages', 'Traditional masala chai', 100, true),
('00000000-0000-0000-0000-000000000001', 'Fresh Juice', 'beverages', 'Seasonal fresh fruit juice (mango/orange/watermelon)', 200, true),
('00000000-0000-0000-0000-000000000001', 'Coffee', 'beverages', 'Fresh brewed coffee (American/Cappuccino/Latte)', 180, true),
('00000000-0000-0000-0000-000000000001', 'Lassi', 'beverages', 'Traditional yogurt drink (sweet or salted)', 150, true),
('00000000-0000-0000-0000-000000000001', 'Gulab Jamun', 'desserts', 'Deep-fried milk dumplings in rose sugar syrup', 150, true),
('00000000-0000-0000-0000-000000000001', 'Ice Cream', 'desserts', 'Vanilla/Chocolate/Strawberry scoop', 200, true),
('00000000-0000-0000-0000-000000000001', 'French Fries', 'snacks', 'Crispy golden french fries with ketchup', 180, true),
('00000000-0000-0000-0000-000000000001', 'Spring Rolls', 'snacks', 'Crispy vegetable spring rolls with dip', 250, true)
ON CONFLICT DO NOTHING;

-- 8. Cleaning requests — using fixed room UUIDs
INSERT INTO cleaning_requests (hotel_id, room_id, priority, status, notes, created_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'high', 'pending', 'Check-out cleaning needed, guest left at 11am', CURRENT_DATE),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000204', 'medium', 'pending', 'Routine cleaning for new arrival tomorrow', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'low', 'in_progress', 'Daily housekeeping service', CURRENT_DATE),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000501', 'high', 'in_progress', 'VIP guest arriving — deep clean required', CURRENT_DATE),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'medium', 'completed', 'Evening turndown service completed', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000504', 'low', 'completed', 'Weekly deep clean done', CURRENT_DATE - 2)
ON CONFLICT DO NOTHING;

-- 9. Payment methods
INSERT INTO payment_methods (hotel_id, name, type, details, active) VALUES
('00000000-0000-0000-0000-000000000001', 'Cash', 'cash', 'Cash payment at reception', true),
('00000000-0000-0000-0000-000000000001', 'Visa/Mastercard', 'card', 'Credit/debit card payment', true),
('00000000-0000-0000-0000-000000000001', 'Bank Transfer', 'bank_transfer', 'Direct bank transfer', true),
('00000000-0000-0000-0000-000000000001', 'eSewa', 'mobile_banking', 'Nepal mobile wallet', true),
('00000000-0000-0000-0000-000000000001', 'Khalti', 'online', 'Online payment gateway', true)
ON CONFLICT DO NOTHING;

-- 10. Invoices — 12 invoices
INSERT INTO invoices (id, hotel_id, guest_id, guest_name, guest_email, items, subtotal, tax, total, amount_paid, balance, status, created_at) VALUES
('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Ram Sharma', 'ram@email.com', '[{"description":"Single Room 102 - 3 nights","quantity":1,"unit_price":7500,"total":7500}]', 7500, 750, 8250, 0, 8250, 'draft', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'Binod Rai', 'binod@email.com', '[{"description":"Premium Double 205 - 5 nights","quantity":1,"unit_price":24000,"total":24000}]', 24000, 2400, 26400, 10000, 16400, 'partial', CURRENT_DATE),
('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000026', 'Sarah Lee', 'sarah@email.com', '[{"description":"Single Room 101 - 2 nights","quantity":1,"unit_price":5000,"total":5000}]', 5000, 500, 5500, 5500, 0, 'paid', CURRENT_DATE - 6),
('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000027', 'Hari Bhandari', 'hari@email.com', '[{"description":"Double Room 203 - 3 nights","quantity":1,"unit_price":12600,"total":12600}]', 12600, 1260, 13860, 13860, 0, 'paid', CURRENT_DATE - 4),
('00000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000028', 'Nina Joshi', 'nina@email.com', '[{"description":"Twin Room 303 - 3 nights","quantity":1,"unit_price":16500,"total":16500}]', 16500, 1650, 18150, 18150, 0, 'paid', CURRENT_DATE - 6),
('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000029', 'Alex Turner', 'alex@email.com', '[{"description":"Suite 403 - 3 nights","quantity":1,"unit_price":25500,"total":25500}]', 25500, 2550, 28050, 0, 28050, 'sent', CURRENT_DATE - 10),
('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Ram Sharma', 'ram@email.com', '[{"description":"Twin Room 301 - 2 nights","quantity":1,"unit_price":10000,"total":10000}]', 10000, 1000, 11000, 11000, 0, 'paid', CURRENT_DATE - 12),
('00000000-0000-0000-0000-000000000077', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Sita Poudel', 'sita@email.com', '[{"description":"Deluxe 501 - 3 nights","quantity":1,"unit_price":36000,"total":36000}]', 36000, 3600, 39600, 39600, 0, 'paid', CURRENT_DATE - 8),
('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'John Doe', 'john@email.com', '[{"description":"Suite 401 - 3 nights","quantity":1,"unit_price":24000,"total":24000}]', 24000, 2400, 26400, 26400, 0, 'paid', CURRENT_DATE - 11),
('00000000-0000-0000-0000-000000000079', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000019', 'Sunita Lama', 'sunita@email.com', '[{"description":"Presidential Suite 502 - 3 nights","quantity":1,"unit_price":45000,"total":45000}]', 45000, 4500, 49500, 0, 49500, 'draft', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000080', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', 'Emily Clark', 'emily@email.com', '[{"description":"Penthouse 504 - 4 nights","quantity":1,"unit_price":80000,"total":80000}]', 80000, 8000, 88000, 88000, 0, 'paid', CURRENT_DATE - 20),
('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'Jane Smith', 'jane@email.com', '[{"description":"Double Room 202 - 2 nights","quantity":1,"unit_price":9000,"total":9000}]', 9000, 900, 9900, 0, 9900, 'overdue', CURRENT_DATE - 15)
ON CONFLICT (id) DO NOTHING;

-- 11. Payments — 8 payments
INSERT INTO payments (hotel_id, invoice_id, amount, status, created_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000072', 5500, 'completed', CURRENT_DATE - 6),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000073', 13860, 'completed', CURRENT_DATE - 4),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000074', 18150, 'completed', CURRENT_DATE - 6),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000076', 11000, 'completed', CURRENT_DATE - 12),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000077', 39600, 'completed', CURRENT_DATE - 8),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000078', 26400, 'completed', CURRENT_DATE - 11),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000080', 88000, 'completed', CURRENT_DATE - 20),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000071', 10000, 'completed', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 13. Activity logs — 15 events
INSERT INTO activity_logs (hotel_id, action, entity_type, details, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Guest checked in', 'booking', '{"guest":"Ram Sharma","room":"102"}', CURRENT_DATE - 3),
('00000000-0000-0000-0000-000000000001', 'Guest checked in', 'booking', '{"guest":"Sita Poudel","room":"103"}', CURRENT_DATE - 2),
('00000000-0000-0000-0000-000000000001', 'Guest checked in', 'booking', '{"guest":"John Doe","room":"201"}', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', 'Guest checked in', 'booking', '{"guest":"Jane Smith","room":"202"}', CURRENT_DATE - 2),
('00000000-0000-0000-0000-000000000001', 'New booking created', 'booking', '{"guest":"Rajesh Hamal","future":"4 nights"}', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', 'Food order delivered', 'food_order', '{"room":"102","items":"Dal Bhat + Tea","total":900}', CURRENT_DATE - 2),
('00000000-0000-0000-0000-000000000001', 'Food order placed', 'food_order', '{"room":"201","items":"Mutton Sekuwa + Tea","total":1500}', CURRENT_DATE),
('00000000-0000-0000-0000-000000000001', 'Payment received', 'payment', '{"amount":13860,"method":"Card","invoice":"#073"}', CURRENT_DATE - 4),
('00000000-0000-0000-0000-000000000001', 'Payment received', 'payment', '{"amount":26400,"method":"Card","invoice":"#078"}', CURRENT_DATE - 11),
('00000000-0000-0000-0000-000000000001', 'Guest checked out', 'booking', '{"guest":"Hari Bhandari","room":"203"}', CURRENT_DATE - 3),
('00000000-0000-0000-0000-000000000001', 'Guest checked out', 'booking', '{"guest":"Sarah Lee","room":"101"}', CURRENT_DATE - 4),
('00000000-0000-0000-0000-000000000001', 'Booking cancelled', 'booking', '{"guest":"Tom Wilson","reason":"Guest request"}', CURRENT_DATE - 10),
('00000000-0000-0000-0000-000000000001', 'Invoice overdue', 'invoice', '{"guest":"Jane Smith","amount":9900}', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', 'Cleaning request completed', 'cleaning', '{"room":"103","type":"Evening turndown"}', CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000001', 'Cleaning request assigned', 'cleaning', '{"room":"501","priority":"high","type":"VIP deep clean"}', CURRENT_DATE);
