-- ====================================================================
-- ASHENS STORE - SCRIPT 08: TABELAS DE CUPONS E UTILIZAÇÕES
-- ====================================================================

-- 1. Tabela de Cupons de Desconto
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    max_discount NUMERIC(10, 2),
    min_order_value NUMERIC(10, 2) DEFAULT 0.00,
    max_uses INTEGER,
    max_uses_per_customer INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ,
    expiration_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    applicability TEXT NOT NULL DEFAULT 'all' CHECK (applicability IN ('all', 'products', 'categories')),
    applicable_product_ids UUID[] DEFAULT '{}',
    applicable_category_ids UUID[] DEFAULT '{}',
    allow_stacking BOOLEAN NOT NULL DEFAULT false,
    current_uses INTEGER NOT NULL DEFAULT 0,
    total_discount_granted NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Registro de Utilizações de Cupons
CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL,
    order_id TEXT NOT NULL,
    customer_email TEXT,
    customer_name TEXT,
    customer_roblox TEXT,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    order_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON public.coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_customer_email ON public.coupon_usages(customer_email);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order_id ON public.coupon_usages(order_id);

-- 4. Políticas de Segurança (Row Level Security)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Leitura pública para validação de cupons ativos
CREATE POLICY "Leitura pública de cupons ativos" ON public.coupons
    FOR SELECT USING (is_active = true);

-- Acesso total para administradores/service_role
CREATE POLICY "Admin total cupons" ON public.coupons
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin total coupon_usages" ON public.coupon_usages
    FOR ALL USING (auth.role() = 'service_role');
