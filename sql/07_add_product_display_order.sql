-- ====================================================================
-- ASHENS STORE - SCRIPT 07: ADICIONAR ORDEM DE EXIBIÇÃO EM PRODUTOS
-- ====================================================================

-- 1. Adicionar coluna display_order na tabela products caso ainda não exista
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Criar índice para acelerar ordenação no catálogo e APIs
CREATE INDEX IF NOT EXISTS idx_products_display_order 
ON public.products(display_order ASC);
