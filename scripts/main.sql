-- =====================================================
  --EXTENSÕES
-- =====================================================
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
  --FUNÇÃO GLOBAL updated_at
-- =====================================================
  CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
  --PROFILES
-- =====================================================
  CREATE TABLE IF NOT EXISTS public.profiles(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer' CHECK(role IN('admin', 'manager', 'customer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--Auto - create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles(user_id, email, full_name)
VALUES(
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
  --ENDEREÇOS
-- =====================================================
  CREATE TABLE IF NOT EXISTS customer_addresses(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    type TEXT DEFAULT 'shipping',
    name TEXT NOT NULL,
    address1 TEXT NOT NULL,
    address2 TEXT,
    city TEXT NOT NULL,
    state_code TEXT NOT NULL,
    country_code TEXT DEFAULT 'BR',
    zip TEXT NOT NULL,
    phone TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

CREATE TRIGGER trg_addr_updated
BEFORE UPDATE ON customer_addresses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
  --CATEGORIAS / CMS SIMPLES
-- =====================================================
  CREATE TABLE IF NOT EXISTS categories(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

CREATE TABLE IF NOT EXISTS contents(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, slug)
  );

CREATE TRIGGER trg_contents_updated
BEFORE UPDATE ON contents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
  --PRODUTOS
-- =====================================================
  CREATE TABLE IF NOT EXISTS products(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10, 2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS product_variants(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT,
    price NUMERIC(10, 2),
    stock INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- =====================================================
  --PEDIDOS
-- =====================================================
  CREATE TABLE IF NOT EXISTS orders(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id),
    status TEXT DEFAULT 'PENDING_PAYMENT',
    subtotal NUMERIC(10, 2),
    shipping_cost NUMERIC(10, 2),
    total NUMERIC(10, 2),
    payment_status TEXT DEFAULT 'pending',
    shipping_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

CREATE TRIGGER trg_orders_updated
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS order_items(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variants(id),
    quantity INT,
    unit_price NUMERIC(10, 2)
  );

-- =====================================================
  --FRETE
-- =====================================================
  CREATE TABLE IF NOT EXISTS shipping_rules(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code CHAR(2) UNIQUE,
    price NUMERIC(10, 2)
  );

INSERT INTO shipping_rules(state_code, price) VALUES
  ('SP', 15), ('RJ', 20), ('MG', 25), ('XX', 40)
ON CONFLICT DO NOTHING;

-- =====================================================
  --STORAGE BUCKET
-- =====================================================
  INSERT INTO storage.buckets(id, name, public)
VALUES('products', 'products', true)
ON CONFLICT DO NOTHING;

-- =====================================================
  --RLS
-- =====================================================
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

--Profiles
CREATE POLICY "profile_own"
ON profiles FOR ALL
USING(auth.uid() = user_id);

--Address
CREATE POLICY "addr_own"
ON customer_addresses FOR ALL
USING(auth.uid() = user_id);

--Orders
CREATE POLICY "orders_own"
ON orders FOR SELECT
USING(auth.uid() = user_id);

--Public read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_products"
ON products FOR SELECT USING(true);

ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_contents"
ON contents FOR SELECT USING(is_published = true);

-- =====================================================
  --ÍNDICES
-- =====================================================
  CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- =====================================================
  --FIM
-- =====================================================
