-- ====================================================================
-- ASHENS STORE - SCRIPT 03: DADOS INICIAIS (SEED BLOX FRUITS)
-- ====================================================================

-- 1. CATEGORIAS OFICIAIS BLOX FRUITS
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Frutas Míticas & Físicas', 'frutas', 'Frutas permanentes e físicas entregues via trade no Blox Fruits.', 1, true),
    ('c2000000-0000-0000-0000-000000000002', 'Gamepasses Roblox', 'gamepasses', 'Gamepasses oficiais ativadas diretamente na sua conta.', 2, true),
    ('c3000000-0000-0000-0000-000000000003', 'Contas Level Máximo & PVP', 'contas', 'Contas prontas com Godhuman, CDK, Soul Guitar e Frutas.', 3, true),
    ('c4000000-0000-0000-0000-000000000004', 'Raças V4 Full Gear', 'racas', 'Desperte a Raça V4 no grau máximo com todas as engrenagens.', 4, true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- Sincronizar com store_categories para compatibilidade total
INSERT INTO public.store_categories (id, name, slug, description, display_order, is_active)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Frutas Míticas & Físicas', 'frutas', 'Frutas permanentes e físicas entregues via trade no Blox Fruits.', 1, true),
    ('c2000000-0000-0000-0000-000000000002', 'Gamepasses Roblox', 'gamepasses', 'Gamepasses oficiais ativadas diretamente na sua conta.', 2, true),
    ('c3000000-0000-0000-0000-000000000003', 'Contas Level Máximo & PVP', 'contas', 'Contas prontas com Godhuman, CDK, Soul Guitar e Frutas.', 3, true),
    ('c4000000-0000-0000-0000-000000000004', 'Raças V4 Full Gear', 'racas', 'Desperte a Raça V4 no grau máximo com todas as engrenagens.', 4, true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- ====================================================================
-- 2. BANNERS DO SLIDER PRINCIPAL
-- ====================================================================
INSERT INTO public.banners (id, title, image_url, link_url, active, display_order)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'Ashens Store - Especialista em Blox Fruits', '/banners/banner-1.jpg', '/loja', true, 1),
    ('b2000000-0000-0000-0000-000000000002', 'Promoção Frutas Míticas & Kitsune', '/banners/banner-2.jpg', '/loja?categoryId=frutas', true, 2)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url, active = EXCLUDED.active;

-- ====================================================================
-- 3. PRODUTOS DO CATÁLOGO
-- ====================================================================

-- 3.1 Fruta Kitsune Física
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd1000000-0000-0000-0000-000000000001',
    'Fruta Kitsune Física',
    'fruta-kitsune-fisica',
    'A fruta Kitsune física mais cobiçada do Blox Fruits. Entrega rápida e 100% segura via trade no servidor VIP do Roblox.',
    49.90,
    69.90,
    '/banners/banner-2.jpg',
    'c1000000-0000-0000-0000-000000000001',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d1000000-0000-0000-0000-000000000001', 'Física (Trade)', 49.90, 49.90, 15, true)
ON CONFLICT DO NOTHING;

-- 3.2 Fruta Dragon (Rework)
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd2000000-0000-0000-0000-000000000002',
    'Fruta Dragon (Rework)',
    'fruta-dragon-rework',
    'Fruta Dragon física garantida antes do rework. Transformação lendária com máximo poder de dano em área.',
    54.90,
    75.00,
    '/banners/banner-1.jpg',
    'c1000000-0000-0000-0000-000000000001',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d2000000-0000-0000-0000-000000000002', 'Física (Trade)', 54.90, 54.90, 10, true)
ON CONFLICT DO NOTHING;

-- 3.3 Fruta Leopard Física
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd3000000-0000-0000-0000-000000000003',
    'Fruta Leopard Física',
    'fruta-leopard-fisica',
    'Leopard física de alto tier para PVP intenso e movimentação veloz. Entregue no Segundo ou Terceiro Mar.',
    34.90,
    45.00,
    '/banners/banner-2.jpg',
    'c1000000-0000-0000-0000-000000000001',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d3000000-0000-0000-0000-000000000003', 'Física (Trade)', 34.90, 34.90, 12, true)
ON CONFLICT DO NOTHING;

-- 3.4 Fruta Dough (Massa) Física
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd4000000-0000-0000-0000-000000000004',
    'Fruta Dough (Massa) Física',
    'fruta-dough-fisica',
    'Fruta Dough física pronta para despertar V2. Essencial para combos imparáveis de Bounty Hunter.',
    29.90,
    40.00,
    '/banners/banner-1.jpg',
    'c1000000-0000-0000-0000-000000000001',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d4000000-0000-0000-0000-000000000004', 'Física (Trade)', 29.90, 29.90, 20, true)
ON CONFLICT DO NOTHING;

-- 3.5 Fruta Buddha Física
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd5000000-0000-0000-0000-000000000005',
    'Fruta Buddha Física',
    'fruta-buddha-fisica',
    'A melhor fruta do jogo para farm de maestria, raids e level máximo. Entrega garantida.',
    19.90,
    28.00,
    '/banners/banner-2.jpg',
    'c1000000-0000-0000-0000-000000000001',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d5000000-0000-0000-0000-000000000005', 'Física (Trade)', 19.90, 19.90, 25, true)
ON CONFLICT DO NOTHING;

-- 3.6 Dark Blade / Yoru (Gamepass)
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd6000000-0000-0000-0000-000000000006',
    'Dark Blade / Yoru (Gamepass)',
    'dark-blade-yoru-gamepass',
    'Gamepass da espada lendária Dark Blade (Yoru). Enviada como presente oficial no inventário do seu Nick Roblox.',
    39.90,
    55.00,
    '/banners/banner-1.jpg',
    'c2000000-0000-0000-0000-000000000002',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d6000000-0000-0000-0000-000000000006', 'Gamepass Presente', 39.90, 39.90, 50, true)
ON CONFLICT DO NOTHING;

-- 3.7 Gamepass 2x Maestria (2x Mastery)
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd7000000-0000-0000-0000-000000000007',
    'Gamepass 2x Maestria (2x Mastery)',
    'gamepass-2x-maestria-mastery',
    'Dobre a velocidade de maestria de todas as suas frutas, espadas e estilos de luta para sempre.',
    18.90,
    25.00,
    '/banners/banner-2.jpg',
    'c2000000-0000-0000-0000-000000000002',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d7000000-0000-0000-0000-000000000007', 'Gamepass Presente', 18.90, 18.90, 50, true)
ON CONFLICT DO NOTHING;

-- 3.8 Gamepass 2x Dinheiro (2x Money)
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd8000000-0000-0000-0000-000000000008',
    'Gamepass 2x Dinheiro (2x Money)',
    'gamepass-2x-dinheiro-money',
    'Receba o dobro de Beli em todas as missões, NPCs e chefes derrotados.',
    18.90,
    25.00,
    '/banners/banner-1.jpg',
    'c2000000-0000-0000-0000-000000000002',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d8000000-0000-0000-0000-000000000008', 'Gamepass Presente', 18.90, 18.90, 50, true)
ON CONFLICT DO NOTHING;

-- 3.9 Gamepass Barcos Rápidos (Fast Boats)
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'd9000000-0000-0000-0000-000000000009',
    'Gamepass Barcos Rápidos (Fast Boats)',
    'gamepass-barcos-rapidos-fast-boats',
    'Navegue com os barcos mais rápidos dos mares e farme Leviathan e Sea Beasts com facilidade.',
    14.90,
    20.00,
    '/banners/banner-2.jpg',
    'c2000000-0000-0000-0000-000000000002',
    true,
    false
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('d9000000-0000-0000-0000-000000000009', 'Gamepass Presente', 14.90, 14.90, 50, true)
ON CONFLICT DO NOTHING;

-- 3.10 Conta Godhuman + CDK + Soul Guitar (Max Lvl 2550)
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, thumbnail_url, category_id, is_active, is_featured)
VALUES (
    'da000000-0000-0000-0000-000000000010',
    'Conta Godhuman + CDK + Soul Guitar (Max Lvl 2550)',
    'conta-godhuman-cdk-soul-guitar-max-lvl',
    'Conta completa sem pin, e-mail limpo e pronta para alterar todos os dados. Level 2550, Godhuman 600 mastery, Cursed Dual Katana e Soul Guitar.',
    69.90,
    99.00,
    '/banners/banner-1.jpg',
    'c3000000-0000-0000-0000-000000000003',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured;

INSERT INTO public.product_variants (product_id, name, price, retail_price, stock, in_stock)
VALUES ('da000000-0000-0000-0000-000000000010', 'Dados Imediatos via Chat', 69.90, 69.90, 8, true)
ON CONFLICT DO NOTHING;
