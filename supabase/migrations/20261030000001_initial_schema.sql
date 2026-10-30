-- Fit DaLi ERP Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  price_unit DECIMAL(10,2) NOT NULL,
  price_c10 DECIMAL(10,2) NOT NULL,
  price_c20 DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  order_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'partial')),
  payment_method TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily production table
CREATE TABLE IF NOT EXISTS daily_production (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_daily_production_date ON daily_production(production_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'categories') THEN
    CREATE POLICY "Enable all for authenticated users" ON categories FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'products') THEN
    CREATE POLICY "Enable all for authenticated users" ON products FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'customers') THEN
    CREATE POLICY "Enable all for authenticated users" ON customers FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'orders') THEN
    CREATE POLICY "Enable all for authenticated users" ON orders FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'order_items') THEN
    CREATE POLICY "Enable all for authenticated users" ON order_items FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'payments') THEN
    CREATE POLICY "Enable all for authenticated users" ON payments FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'daily_production') THEN
    CREATE POLICY "Enable all for authenticated users" ON daily_production FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'expenses') THEN
    CREATE POLICY "Enable all for authenticated users" ON expenses FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Default categories
INSERT INTO categories (name, color, price_unit, price_c10, price_c20) VALUES
  ('Low Carb', '#38a149', 24.90, 239.00, 458.00),
  ('Arroz Branco', '#e60067', 21.90, 199.00, 378.00),
  ('Arroz Integral', '#689f38', 22.90, 219.00, 418.00)
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color,
  price_unit = EXCLUDED.price_unit,
  price_c10 = EXCLUDED.price_c10,
  price_c20 = EXCLUDED.price_c20;

-- Products for Low Carb
INSERT INTO products (category_id, name, description, active)
SELECT id, 'Carne moída + seleta', 'Carne moída magra temperada com mix de legumes frescos', true
FROM categories WHERE name = 'Low Carb'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Frango cremoso + seleta', 'Cubos de frango suculentos ao molho cremoso light com seleta', true
FROM categories WHERE name = 'Low Carb'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Patinho de panela + seleta', 'Patinho desfiado cozido lentamente com ervas e seleta', true
FROM categories WHERE name = 'Low Carb'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Patinho cremoso + seleta', 'Tiras de patinho com molho cremoso funcional e seleta de legumes', true
FROM categories WHERE name = 'Low Carb'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Strogonoff light de frango + seleta', 'Strogonoff de frango sem lactose/creme leve com seleta', true
FROM categories WHERE name = 'Low Carb'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Strogonoff light de carne + seleta', 'Strogonoff de carne magra light acompanhado de seleta', true
FROM categories WHERE name = 'Low Carb'
ON CONFLICT DO NOTHING;

-- Products for Arroz Branco
INSERT INTO products (category_id, name, description, active)
SELECT id, 'Almôndegas arroz + seleta', 'Almôndegas artesanais ao molho caseiro, arroz branco soltinho e seleta', true
FROM categories WHERE name = 'Arroz Branco'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Patinho de panela arroz + seleta', 'Patinho macio de panela, arroz branco e seleta de legumes', true
FROM categories WHERE name = 'Arroz Branco'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Patinho cremoso arroz + seleta', 'Patinho cremoso especial, arroz branco e seleta', true
FROM categories WHERE name = 'Arroz Branco'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Frango cremoso arroz + seleta', 'Frango desfiado cremoso, arroz branco e seleta de legumes', true
FROM categories WHERE name = 'Arroz Branco'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Frango ao molho de laranja e gengibre arroz + seleta', 'Frango aromatizado com toque cítrico de laranja e gengibre, arroz e seleta', true
FROM categories WHERE name = 'Arroz Branco'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Strogonoff light de frango arroz + seleta', 'Strogonoff de frango light com arroz branco e seleta', true
FROM categories WHERE name = 'Arroz Branco'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Strogonoff light de carne arroz + seleta', 'Strogonoff de carne light com arroz branco e seleta', true
FROM categories WHERE name = 'Arroz Branco'
ON CONFLICT DO NOTHING;

-- Products for Arroz Integral
INSERT INTO products (category_id, name, description, active)
SELECT id, 'Carne moída arroz integral + seleta', 'Carne moída temperada, arroz integral nutritivo e seleta', true
FROM categories WHERE name = 'Arroz Integral'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, active)
SELECT id, 'Rocambole de frango arroz integral + seleta', 'Rocambole de frango assado recheado, arroz integral e seleta', true
FROM categories WHERE name = 'Arroz Integral'
ON CONFLICT DO NOTHING;

