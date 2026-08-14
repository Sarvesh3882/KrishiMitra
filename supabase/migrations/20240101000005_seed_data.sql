-- ============================================================
-- Seed buyer_requirements (demo data for prototype matching)
-- ============================================================
INSERT INTO buyer_requirements (product, quantity_needed, unit, quality_grade, price_range_min, price_range_max, required_by, state, district, contact_method, status) VALUES
  ('Tomato', 500, 'kg', 'A', 1000, 1500, CURRENT_DATE + INTERVAL '30 days', 'Maharashtra', 'Nashik', 'wa.me/919876543210', 'active'),
  ('Oyster Mushroom', 100, 'kg', 'Fresh', 150, 250, CURRENT_DATE + INTERVAL '14 days', 'Maharashtra', 'Pune', 'wa.me/919876543211', 'active'),
  ('Honey', 50, 'kg', 'Pure', 300, 500, CURRENT_DATE + INTERVAL '60 days', 'Maharashtra', 'Nashik', 'wa.me/919876543212', 'active'),
  ('Broiler Chicken', 200, 'kg', 'Live', 90, 120, CURRENT_DATE + INTERVAL '7 days', 'Maharashtra', 'Ahmednagar', 'wa.me/919876543213', 'active'),
  ('Fish (Rohu)', 150, 'kg', 'Fresh', 180, 250, CURRENT_DATE + INTERVAL '3 days', 'Maharashtra', 'Kolhapur', 'wa.me/919876543214', 'active');

-- ============================================================
-- Seed WhatsApp groups directory
-- ============================================================
INSERT INTO groups (name, description, enterprise_type, state, district, join_link) VALUES
  ('Nashik Poultry Farmers', 'Group for poultry farmers in Nashik district sharing tips, prices and disease alerts', 'poultry', 'Maharashtra', 'Nashik', 'https://wa.me/919000000001'),
  ('Maharashtra Beekeepers', 'Apiculture farmers across Maharashtra - honey markets, disease prevention, equipment', 'apiculture', 'Maharashtra', NULL, 'https://wa.me/919000000002'),
  ('Pune Mushroom Growers', 'Mushroom cultivation group for Pune region - spawn sources, buyers, techniques', 'mushroom', 'Maharashtra', 'Pune', 'https://wa.me/919000000003');
