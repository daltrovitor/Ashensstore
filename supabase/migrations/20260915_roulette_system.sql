-- Migration: 20260915_roulette_system.sql
-- Description: Tabelas e regras do sistema de roleta da Ashens Store

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE TABLE IF NOT EXISTS public.user_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    spins_balance INTEGER NOT NULL DEFAULT 0 CHECK (spins_balance >= 0),
    total_spins_performed INTEGER NOT NULL DEFAULT 0 CHECK (total_spins_performed >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE INDEX IF NOT EXISTS idx_roulette_prizes_active ON public.roulette_prizes(is_active);
CREATE INDEX IF NOT EXISTS idx_roulette_codes_code ON public.roulette_codes(code);
CREATE INDEX IF NOT EXISTS idx_roulette_codes_status ON public.roulette_codes(status);
CREATE INDEX IF NOT EXISTS idx_user_spins_user_id ON public.user_spins(user_id);
CREATE INDEX IF NOT EXISTS idx_roulette_spins_user_id ON public.roulette_spins(user_id);
CREATE INDEX IF NOT EXISTS idx_roulette_spins_created_at ON public.roulette_spins(created_at DESC);
