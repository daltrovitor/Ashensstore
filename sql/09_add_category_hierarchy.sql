-- ====================================================================
-- ASHENS STORE - SCRIPT 09: HIERARQUIA DE CATEGORIAS E IMAGENS
-- ====================================================================

-- 1. Adicionar coluna para diferenciar Categorias Principais (true) de Comuns (false)
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_main BOOLEAN NOT NULL DEFAULT false;

-- 2. Adicionar coluna para a imagem da Categoria Principal (upload do usuário)
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Adicionar relacionamento hierárquico (parent_id) ligando Categoria Comum à Categoria Principal
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 4. Criar índice para performance em buscas hierárquicas
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_is_main_idx ON public.categories(is_main);
