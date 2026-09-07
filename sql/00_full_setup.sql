-- ====================================================================
-- ASHENS STORE - SCRIPT MESTRE COMPLETO (00_full_setup.sql)
-- Execução tudo-em-um no Supabase SQL Editor para criar o banco do zero
-- ====================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABELAS PRINCIPAIS
-- ====================================================================

-- 2.1 PROFILES (Perfis de Usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'manager', 'admin', 'costumer')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 CATEGORIAS (categories & store_categories para compatibilidade total)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    compare_at_price NUMERIC(10, 2),
    thumbnail_url TEXT,
    images TEXT[] DEFAULT '{}',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    printful_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4 VARIANTES DE PRODUTO
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    size TEXT,
    color TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    sku TEXT,
    stock INTEGER NOT NULL DEFAULT 10,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    printful_catalog_variant_id TEXT,
    printful_variant_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5 MOCKUPS / GALERIA DO PRODUTO
CREATE TABLE IF NOT EXISTS public.product_mockups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_main BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6 PEDIDOS (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL DEFAULT 'pix',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_test BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.7 ITENS DOS PEDIDOS (ORDER_ITEMS)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8 BANNERS DO SLIDER
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Banner Promocional',
    image_url TEXT NOT NULL,
    link_url TEXT DEFAULT '/loja',
    active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hero_slider_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9 ENDEREÇOS E HISTÓRICO
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing')),
    name TEXT NOT NULL,
    address1 TEXT NOT NULL,
    address2 TEXT,
    city TEXT NOT NULL,
    state_code TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'BR',
    zip TEXT NOT NULL,
    phone TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipping_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_order_value NUMERIC(10, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 3. ÍNDICES DE ALTA PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(active);

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slider_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admins have full profile access" ON public.profiles;
CREATE POLICY "Admins have full profile access" ON public.profiles FOR ALL USING (public.is_admin());

-- Categories
DROP POLICY IF EXISTS "Categories public read" ON public.categories;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Categories admin manage" ON public.categories;
CREATE POLICY "Categories admin manage" ON public.categories FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Store Categories public read" ON public.store_categories;
CREATE POLICY "Store Categories public read" ON public.store_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store Categories admin manage" ON public.store_categories;
CREATE POLICY "Store Categories admin manage" ON public.store_categories FOR ALL USING (public.is_admin());

-- Products
DROP POLICY IF EXISTS "Products public read" ON public.products;
CREATE POLICY "Products public read" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Products admin manage" ON public.products;
CREATE POLICY "Products admin manage" ON public.products FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Variants public read" ON public.product_variants;
CREATE POLICY "Variants public read" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Variants admin manage" ON public.product_variants;
CREATE POLICY "Variants admin manage" ON public.product_variants FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Mockups public read" ON public.product_mockups;
CREATE POLICY "Mockups public read" ON public.product_mockups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Mockups admin manage" ON public.product_mockups;
CREATE POLICY "Mockups admin manage" ON public.product_mockups FOR ALL USING (public.is_admin());

-- Banners
DROP POLICY IF EXISTS "Banners public read" ON public.banners;
CREATE POLICY "Banners public read" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Banners admin manage" ON public.banners;
CREATE POLICY "Banners admin manage" ON public.banners FOR ALL USING (public.is_admin());

-- Orders
DROP POLICY IF EXISTS "Orders user read" ON public.orders;
CREATE POLICY "Orders user read" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Orders insert" ON public.orders;
CREATE POLICY "Orders insert" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Orders admin manage" ON public.orders;
CREATE POLICY "Orders admin manage" ON public.orders FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Order items read" ON public.order_items;
CREATE POLICY "Order items read" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "Order items insert" ON public.order_items;
CREATE POLICY "Order items insert" ON public.order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Order items admin manage" ON public.order_items;
CREATE POLICY "Order items admin manage" ON public.order_items FOR ALL USING (public.is_admin());

-- Addresses, Login, Shipping
DROP POLICY IF EXISTS "Addresses user manage" ON public.customer_addresses;
CREATE POLICY "Addresses user manage" ON public.customer_addresses FOR ALL USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Login history admin read" ON public.login_history;
CREATE POLICY "Login history admin read" ON public.login_history FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Shipping rules public read" ON public.shipping_rules;
CREATE POLICY "Shipping rules public read" ON public.shipping_rules FOR SELECT USING (true);

-- ====================================================================
-- 5. TRIGGERS AUTOMÁTICOS
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'customer'
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar contas que tenham "admin" no e-mail ou nome para a role 'admin'
UPDATE public.profiles 
SET role = 'admin' 
WHERE email ILIKE '%admin%' OR full_name ILIKE '%admin%';

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
DROP TRIGGER IF EXISTS set_timestamp_products ON public.products;
CREATE TRIGGER set_timestamp_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
DROP TRIGGER IF EXISTS set_timestamp_orders ON public.orders;
CREATE TRIGGER set_timestamp_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
DROP TRIGGER IF EXISTS set_timestamp_banners ON public.banners;
CREATE TRIGGER set_timestamp_banners BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ====================================================================
-- 6. POPULAÇÃO INICIAL (CATEGORIAS, BANNERS E PRODUTOS)
-- ====================================================================

-- 6.1 Categorias Blox Fruits
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Frutas Míticas & Físicas', 'frutas', 'Frutas permanentes e físicas entregues via trade no Blox Fruits.', 1, true),
    ('c2000000-0000-0000-0000-000000000002', 'Gamepasses Roblox', 'gamepasses', 'Gamepasses oficiais ativadas diretamente na sua conta.', 2, true),
    ('c3000000-0000-0000-0000-000000000003', 'Contas Level Máximo & PVP', 'contas', 'Contas prontas com Godhuman, CDK, Soul Guitar e Frutas.', 3, true),
    ('c4000000-0000-0000-0000-000000000004', 'Raças V4 Full Gear', 'racas', 'Desperte a Raça V4 no grau máximo com todas as engrenagens.', 4, true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.store_categories (id, name, slug, description, display_order, is_active)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Frutas Míticas & Físicas', 'frutas', 'Frutas permanentes e físicas entregues via trade no Blox Fruits.', 1, true),
    ('c2000000-0000-0000-0000-000000000002', 'Gamepasses Roblox', 'gamepasses', 'Gamepasses oficiais ativadas diretamente na sua conta.', 2, true),
    ('c3000000-0000-0000-0000-000000000003', 'Contas Level Máximo & PVP', 'contas', 'Contas prontas com Godhuman, CDK, Soul Guitar e Frutas.', 3, true),
    ('c4000000-0000-0000-0000-000000000004', 'Raças V4 Full Gear', 'racas', 'Desperte a Raça V4 no grau máximo com todas as engrenagens.', 4, true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 6.2 Banners Iniciais do Slider
INSERT INTO public.banners (id, title, image_url, link_url, active, display_order)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'Ashens Store - Especialista em Blox Fruits', '/banners/banner-1.jpg', '/loja', true, 1),
    ('b2000000-0000-0000-0000-000000000002', 'Promoção Frutas Míticas & Kitsune', '/banners/banner-2.jpg', '/loja?categoryId=frutas', true, 2)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url, active = EXCLUDED.active;

-- 6.3 Produtos Blox Fruits
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Fruta Kitsune Física', 'fruta-kitsune-fisica', 'A fruta Kitsune física mais cobiçada do Blox Fruits. Entrega rápida via trade no servidor VIP.', 49.90, 69.90, '/banners/banner-2.jpg', 'c1000000-0000-0000-0000-000000000001', true, true),
    ('d2000000-0000-0000-0000-000000000002', 'Fruta Dragon (Rework)', 'fruta-dragon-rework', 'Fruta Dragon física garantida antes do rework lendário.', 54.90, 75.00, '/banners/banner-1.jpg', 'c1000000-0000-0000-0000-000000000001', true, true),
    ('d3000000-0000-0000-0000-000000000003', 'Fruta Leopard Física', 'fruta-leopard-fisica', 'Leopard física de alto tier para PVP intenso e movimentação veloz.', 34.90, 45.00, '/banners/banner-2.jpg', 'c1000000-0000-0000-0000-000000000001', true, true),
    ('d4000000-0000-0000-0000-000000000004', 'Fruta Dough (Massa) Física', 'fruta-dough-fisica', 'Fruta Dough física pronta para despertar V2 e combos de Bounty.', 29.90, 40.00, '/banners/banner-1.jpg', 'c1000000-0000-0000-0000-000000000001', true, true),
    ('d5000000-0000-0000-0000-000000000005', 'Fruta Buddha Física', 'fruta-buddha-fisica', 'A melhor fruta do jogo para farm de maestria, raids e level máximo.', 19.90, 28.00, '/banners/banner-2.jpg', 'c1000000-0000-0000-0000-000000000001', true, true),
    ('d6000000-0000-0000-0000-000000000006', 'Dark Blade / Yoru (Gamepass)', 'dark-blade-yoru-gamepass', 'Gamepass da espada lendária Dark Blade enviada diretamente no seu inventário.', 39.90, 55.00, '/banners/banner-1.jpg', 'c2000000-0000-0000-0000-000000000002', true, true),
    ('d7000000-0000-0000-0000-000000000007', 'Gamepass 2x Maestria (2x Mastery)', 'gamepass-2x-maestria-mastery', 'Dobre a velocidade de maestria de frutas, espadas e estilos de luta.', 18.90, 25.00, '/banners/banner-2.jpg', 'c2000000-0000-0000-0000-000000000002', true, true),
    ('d8000000-0000-0000-0000-000000000008', 'Gamepass 2x Dinheiro (2x Money)', 'gamepass-2x-dinheiro-money', 'Receba o dobro de Beli em todas as missões e chefes derrotados.', 18.90, 25.00, '/banners/banner-1.jpg', 'c2000000-0000-0000-0000-000000000002', true, true),
    ('d9000000-0000-0000-0000-000000000009', 'Gamepass Barcos Rápidos (Fast Boats)', 'gamepass-barcos-rapidos-fast-boats', 'Barcos velozes para caçar Sea Beasts e navegar com facilidade.', 14.90, 20.00, '/banners/banner-2.jpg', 'c2000000-0000-0000-0000-000000000002', true, false),
    ('da000000-0000-0000-0000-000000000010', 'Conta Godhuman + CDK + Soul Guitar (Max Lvl 2550)', 'conta-godhuman-cdk-soul-guitar-max-lvl', 'Conta completa sem pin, email limpo, Level 2550, Godhuman 600 mastery.', 69.90, 99.00, '/banners/banner-1.jpg', 'c3000000-0000-0000-0000-000000000003', true, true)
ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

-- 6.4 Variantes
INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Física (Trade)', 49.90, 49.90, 15, true),
    ('d2000000-0000-0000-0000-000000000002', 'Física (Trade)', 54.90, 54.90, 10, true),
    ('d3000000-0000-0000-0000-000000000003', 'Física (Trade)', 34.90, 34.90, 12, true),
    ('d4000000-0000-0000-0000-000000000004', 'Física (Trade)', 29.90, 29.90, 20, true),
    ('d5000000-0000-0000-0000-000000000005', 'Física (Trade)', 19.90, 19.90, 25, true),
    ('d6000000-0000-0000-0000-000000000006', 'Gamepass Presente', 39.90, 39.90, 50, true),
    ('d7000000-0000-0000-0000-000000000007', 'Gamepass Presente', 18.90, 18.90, 50, true),
    ('d8000000-0000-0000-0000-000000000008', 'Gamepass Presente', 18.90, 18.90, 50, true),
    ('d9000000-0000-0000-0000-000000000009', 'Gamepass Presente', 14.90, 14.90, 50, true),
    ('da000000-0000-0000-0000-000000000010', 'Dados Imediatos via Chat', 69.90, 69.90, 8, true)
ON CONFLICT DO NOTHING;

-- ====================================================================
-- 7. STORAGE BUCKETS
-- ====================================================================
-- Criação dos buckets públicos para imagens de banners, produtos e uploads.
-- No Supabase, com public = true, os arquivos são servidos publicamente de forma
-- nativa pela CDN sem necessidade de comandos DDL na tabela do sistema storage.objects.
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('images', 'images', true),
    ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
