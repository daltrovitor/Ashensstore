-- ====================================================================
-- ASHENS STORE - SCRIPT 02: SEGURANÇA, RLS & TRIGGERS
-- ====================================================================

-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
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

-- ====================================================================
-- 2. FUNÇÃO AUXILIAR: VERIFICAR SE O USUÁRIO É ADMINISTRADOR
-- ====================================================================
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

-- ====================================================================
-- 3. POLÍTICAS: PROFILES
-- ====================================================================
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full profile access" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins have full profile access" ON public.profiles
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- 4. POLÍTICAS: CATEGORIES & STORE_CATEGORIES
-- ====================================================================
DROP POLICY IF EXISTS "Categories public read" ON public.categories;
DROP POLICY IF EXISTS "Categories admin manage" ON public.categories;
DROP POLICY IF EXISTS "Store Categories public read" ON public.store_categories;
DROP POLICY IF EXISTS "Store Categories admin manage" ON public.store_categories;

CREATE POLICY "Categories public read" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Categories admin manage" ON public.categories
    FOR ALL USING (public.is_admin());

CREATE POLICY "Store Categories public read" ON public.store_categories
    FOR SELECT USING (true);

CREATE POLICY "Store Categories admin manage" ON public.store_categories
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- 5. POLÍTICAS: PRODUCTS, VARIANTS & MOCKUPS (Público Lê, Admin Gerencia)
-- ====================================================================
DROP POLICY IF EXISTS "Products public read" ON public.products;
DROP POLICY IF EXISTS "Products admin manage" ON public.products;
DROP POLICY IF EXISTS "Variants public read" ON public.product_variants;
DROP POLICY IF EXISTS "Variants admin manage" ON public.product_variants;
DROP POLICY IF EXISTS "Mockups public read" ON public.product_mockups;
DROP POLICY IF EXISTS "Mockups admin manage" ON public.product_mockups;

CREATE POLICY "Products public read" ON public.products
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Products admin manage" ON public.products
    FOR ALL USING (public.is_admin());

CREATE POLICY "Variants public read" ON public.product_variants
    FOR SELECT USING (true);

CREATE POLICY "Variants admin manage" ON public.product_variants
    FOR ALL USING (public.is_admin());

CREATE POLICY "Mockups public read" ON public.product_mockups
    FOR SELECT USING (true);

CREATE POLICY "Mockups admin manage" ON public.product_mockups
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- 6. POLÍTICAS: BANNERS & SLIDER
-- ====================================================================
DROP POLICY IF EXISTS "Banners public read" ON public.banners;
DROP POLICY IF EXISTS "Banners admin manage" ON public.banners;
DROP POLICY IF EXISTS "Hero slider public read" ON public.hero_slider_images;
DROP POLICY IF EXISTS "Hero slider admin manage" ON public.hero_slider_images;

CREATE POLICY "Banners public read" ON public.banners
    FOR SELECT USING (true);

CREATE POLICY "Banners admin manage" ON public.banners
    FOR ALL USING (public.is_admin());

CREATE POLICY "Hero slider public read" ON public.hero_slider_images
    FOR SELECT USING (true);

CREATE POLICY "Hero slider admin manage" ON public.hero_slider_images
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- 7. POLÍTICAS: ORDERS & ORDER_ITEMS
-- ====================================================================
DROP POLICY IF EXISTS "Orders user read" ON public.orders;
DROP POLICY IF EXISTS "Orders insert" ON public.orders;
DROP POLICY IF EXISTS "Orders admin manage" ON public.orders;
DROP POLICY IF EXISTS "Order items read" ON public.order_items;
DROP POLICY IF EXISTS "Order items insert" ON public.order_items;
DROP POLICY IF EXISTS "Order items admin manage" ON public.order_items;

CREATE POLICY "Orders user read" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Orders insert" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders admin manage" ON public.orders
    FOR ALL USING (public.is_admin());

CREATE POLICY "Order items read" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Order items insert" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Order items admin manage" ON public.order_items
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- 8. POLÍTICAS: CUSTOMER ADDRESSES, LOGIN HISTORY & SHIPPING
-- ====================================================================
DROP POLICY IF EXISTS "Addresses user manage" ON public.customer_addresses;
DROP POLICY IF EXISTS "Login history admin read" ON public.login_history;
DROP POLICY IF EXISTS "Shipping rules public read" ON public.shipping_rules;

CREATE POLICY "Addresses user manage" ON public.customer_addresses
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Login history admin read" ON public.login_history
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Shipping rules public read" ON public.shipping_rules
    FOR SELECT USING (true);

-- ====================================================================
-- 9. TRIGGER: CRIAÇÃO AUTOMÁTICA DE PERFIL AO REGISTRAR USUÁRIO
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
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 10. TRIGGER: ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMP (updated_at)
-- ====================================================================
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
