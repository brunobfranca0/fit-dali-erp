-- Sample data for testing (optional)
-- Run this after schema.sql if you want test data

-- Insert sample customers
INSERT INTO customers (name, phone, email, address, notes) VALUES
  ('Maria Silva', '35988881111', 'maria@email.com', 'Rua das Flores, 123', 'Cliente VIP'),
  ('João Santos', '35988882222', 'joao@email.com', 'Av. Principal, 456', 'Preferência por marmitas Light'),
  ('Ana Paula', '35988883333', 'ana@email.com', 'Rua Central, 789', NULL);

-- Insert sample products
INSERT INTO products (category_id, name, description, active) 
SELECT 
  c.id,
  c.name || ' - Frango com Batata Doce',
  'Peito de frango grelhado, batata doce assada, brócolis e cenoura',
  true
FROM categories c
WHERE c.name = 'Fit';

INSERT INTO products (category_id, name, description, active) 
SELECT 
  c.id,
  c.name || ' - Peixe com Legumes',
  'Filé de tilápia grelhado, mix de legumes no vapor',
  true
FROM categories c
WHERE c.name = 'Light';

INSERT INTO products (category_id, name, description, active) 
SELECT 
  c.id,
  c.name || ' - Grão de Bico com Quinoa',
  'Grão de bico temperado, quinoa, couve refogada',
  true
FROM categories c
WHERE c.name = 'Vegano';

INSERT INTO products (category_id, name, description, active) 
SELECT 
  c.id,
  c.name || ' - Picanha com Arroz Integral',
  'Picanha grelhada, arroz integral, feijão preto',
  true
FROM categories c
WHERE c.name = 'Proteica';

-- Insert sample orders
DO $$
DECLARE
  customer_id_1 UUID;
  customer_id_2 UUID;
  order_id_1 UUID;
  order_id_2 UUID;
  category_fit_id UUID;
  category_light_id UUID;
BEGIN
  -- Get customer IDs
  SELECT id INTO customer_id_1 FROM customers WHERE name = 'Maria Silva';
  SELECT id INTO customer_id_2 FROM customers WHERE name = 'João Santos';
  
  -- Get category IDs
  SELECT id INTO category_fit_id FROM categories WHERE name = 'Fit';
  SELECT id INTO category_light_id FROM categories WHERE name = 'Light';

  -- Order 1: Maria Silva - 20 Fit meals
  INSERT INTO orders (
    customer_id, customer_name, customer_phone, 
    order_date, delivery_date, 
    status, payment_status, payment_method,
    subtotal, discount, total
  ) VALUES (
    customer_id_1, 'Maria Silva', '35988881111',
    CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE,
    'confirmed', 'paid', 'PIX',
    300.00, 0, 300.00
  ) RETURNING id INTO order_id_1;

  INSERT INTO order_items (order_id, category_id, product_name, quantity, unit_price, subtotal)
  VALUES (order_id_1, category_fit_id, 'Fit', 20, 15.00, 300.00);

  -- Order 2: João Santos - 10 Light meals
  INSERT INTO orders (
    customer_id, customer_name, customer_phone,
    order_date, delivery_date,
    status, payment_status, payment_method,
    subtotal, discount, total
  ) VALUES (
    customer_id_2, 'João Santos', '35988882222',
    CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day',
    'preparing', 'pending', NULL,
    180.00, 0, 180.00
  ) RETURNING id INTO order_id_2;

  INSERT INTO order_items (order_id, category_id, product_name, quantity, unit_price, subtotal)
  VALUES (order_id_2, category_light_id, 'Light', 10, 18.00, 180.00);

  -- Order 3: Ana Paula - Mixed order
  INSERT INTO orders (
    customer_name, customer_phone,
    order_date, delivery_date,
    status, payment_status,
    subtotal, discount, total,
    notes
  ) VALUES (
    'Ana Paula', '35988883333',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days',
    'pending', 'pending',
    330.00, 0, 330.00,
    'Entregar após às 18h'
  ) RETURNING id INTO order_id_1;

  INSERT INTO order_items (order_id, category_id, product_name, quantity, unit_price, subtotal)
  VALUES 
    (order_id_1, category_fit_id, 'Fit', 10, 16.00, 160.00),
    (order_id_1, category_light_id, 'Light', 10, 18.00, 180.00);

END $$;
