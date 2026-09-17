-- ====================================================================
-- ASHENS STORE - SCRIPT 08: SISTEMA DE ROLETA
-- ====================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABELA: ROULETTE_PRIZES (Prêmios da Roleta)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.roulette_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    probability NUMERIC(5, 2) NOT NULL DEFAULT 1.00 CHECK (probability >= 0),
    redemption_type TEXT NOT NULL DEFAULT 'discord' CHECK (redemption_type IN ('automatic', 'discord')),
    delivery_info TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 3. TABELA: USER_SPINS (Saldo de Giros por Usuário)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    spins_balance INTEGER NOT NULL DEFAULT 0 CHECK (spins_balance >= 0),
    total_spins_performed INTEGER NOT NULL DEFAULT 0 CHECK (total_spins_performed >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 4. TABELA: ROULETTE_CODES (Códigos de Giros)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.roulette_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    spins_count INTEGER NOT NULL DEFAULT 1 CHECK (spins_count > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'disabled')),
    created_by TEXT NOT NULL DEFAULT 'admin',
    order_id TEXT,
    redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    redeemed_by_email TEXT,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 5. TABELA: ROULETTE_SPINS (Histórico de Giros e Prêmios Conquistados)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.roulette_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spin_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    prize_id UUID REFERENCES public.roulette_prizes(id) ON DELETE SET NULL,
    prize_name TEXT NOT NULL,
    prize_image TEXT NOT NULL,
    redemption_type TEXT NOT NULL DEFAULT 'discord' CHECK (redemption_type IN ('automatic', 'discord')),
    delivery_info TEXT,
    claim_status TEXT NOT NULL DEFAULT 'pending' CHECK (claim_status IN ('pending', 'claimed', 'delivered')),
    claimed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 6. ÍNDICES DE PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_roulette_prizes_active ON public.roulette_prizes(is_active);
CREATE INDEX IF NOT EXISTS idx_roulette_codes_code ON public.roulette_codes(code);
CREATE INDEX IF NOT EXISTS idx_roulette_codes_status ON public.roulette_codes(status);
CREATE INDEX IF NOT EXISTS idx_user_spins_user_id ON public.user_spins(user_id);
CREATE INDEX IF NOT EXISTS idx_roulette_spins_user_id ON public.roulette_spins(user_id);
CREATE INDEX IF NOT EXISTS idx_roulette_spins_created_at ON public.roulette_spins(created_at DESC);

-- ====================================================================
-- 7. POLÍTICAS RLS (Row Level Security)
-- ====================================================================
ALTER TABLE public.roulette_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_spins ENABLE ROW LEVEL SECURITY;

-- Prêmios: Qualquer pessoa pode visualizar os prêmios ativos
CREATE POLICY "Public read active roulette prizes"
    ON public.roulette_prizes FOR SELECT
    USING (is_active = true);

-- User spins: Usuários só visualizam o próprio saldo
CREATE POLICY "Users view own spins balance"
    ON public.user_spins FOR SELECT
    USING (auth.uid() = user_id);

-- Roulette spins: Usuários só visualizam os próprios giros
CREATE POLICY "Users view own spins history"
    ON public.roulette_spins FOR SELECT
    USING (auth.uid() = user_id);

-- Serviço / Admin: Acesso total
CREATE POLICY "Service role full access roulette prizes"
    ON public.roulette_prizes FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access user spins"
    ON public.user_spins FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access roulette codes"
    ON public.roulette_codes FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access roulette spins"
    ON public.roulette_spins FOR ALL
    USING (true)
    WITH CHECK (true);
