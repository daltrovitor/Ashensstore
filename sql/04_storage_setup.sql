-- ====================================================================
-- ASHENS STORE - SCRIPT 04: CONFIGURAÇÃO DE STORAGE (BUCKETS DE IMAGEM)
-- ====================================================================

-- 1. Criar buckets públicos "images" e "uploads" se não existirem
-- No Supabase, buckets com public = true servem arquivos publicamente
-- de forma nativa e segura através da CDN sem requerer comandos DDL
-- na tabela do sistema storage.objects (que pertence a supabase_storage_admin).
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('images', 'images', true),
    ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

