-- ====================================================================
-- ASHENS STORE - FIX RÁPIDO: PROFILES, COLUNAS & ROLE ADMIN
-- Execute este script no SQL Editor do Supabase para corrigir:
-- 1. O erro de constraint 'profiles_role_check'
-- 2. As colunas phone e avatar_url ausentes
-- 3. Definir a conta admin@ashens.store como role 'admin'
-- ====================================================================

-- 1. Adicionar colunas caso ainda não existam
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Atualizar a restrição de role para permitir 'customer', 'costumer', 'manager' e 'admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'costumer', 'manager', 'admin'));

-- 3. Definir a conta oficial da loja como 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@ashens.store';

-- 4. Garantir que TODOS os outros usuários (incluindo apadmin@viraweb.online) sejam 'customer'
UPDATE public.profiles
SET role = 'customer'
WHERE email <> 'admin@ashens.store';

-- 5. Atualizar o trigger para que NENHUM novo usuário ganhe admin automaticamente
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
    ON CONFLICT (user_id) DO UPDATE SET role = 'customer' WHERE public.profiles.email <> 'admin@ashens.store';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
