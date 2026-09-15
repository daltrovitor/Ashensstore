const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE_URL = 'http://localhost:3000'
const BUCKET_NAME = 'app_data'
const COUPONS_FILE_NAME = 'coupons.json'
const COUPON_USAGES_FILE_NAME = 'coupon_usages.json'

async function getStoredCoupons() {
    const { data } = await supabase.storage.from(BUCKET_NAME).download(COUPONS_FILE_NAME)
    if (!data) return []
    const text = await data.text()
    return text ? JSON.parse(text) : []
}

async function saveStoredCoupons(coupons) {
    await supabase.storage.from(BUCKET_NAME).upload(COUPONS_FILE_NAME, JSON.stringify(coupons, null, 2), {
        upsert: true,
        contentType: 'application/json',
    })
}

async function runApiTests() {
    console.log('=== TESTES E2E DE CUPONS VIA HTTP API ===\n')
    let passed = 0
    let failed = 0

    function assert(cond, desc) {
        if (cond) {
            console.log(`✅ [PASS] ${desc}`)
            passed++
        } else {
            console.error(`❌ [FAIL] ${desc}`)
            failed++
        }
    }

    try {
        let coupons = await getStoredCoupons()

        // 1. Criação de cupons de teste direto no storage
        const testCoupons = [
            {
                id: 'test_pct_15',
                code: 'ASHEN15',
                description: '15% de desconto em tudo',
                discount_type: 'percentage',
                discount_value: 15,
                is_active: true,
                applicability: 'all',
                current_uses: 0,
                total_discount_granted: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'test_fix_20',
                code: 'VALE20',
                description: 'R$ 20 fixos',
                discount_type: 'fixed',
                discount_value: 20,
                is_active: true,
                applicability: 'all',
                current_uses: 0,
                total_discount_granted: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'test_cap_50',
                code: 'TETO30',
                description: '50% com teto de R$ 30',
                discount_type: 'percentage',
                discount_value: 50,
                max_discount: 30,
                is_active: true,
                applicability: 'all',
                current_uses: 0,
                total_discount_granted: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'test_expired',
                code: 'VENCIDO10',
                description: 'Cupom expirado',
                discount_type: 'percentage',
                discount_value: 10,
                expiration_date: '2023-01-01',
                is_active: true,
                applicability: 'all',
                current_uses: 0,
                total_discount_granted: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'test_inactive',
                code: 'DESATIVADO',
                description: 'Cupom desativado',
                discount_type: 'percentage',
                discount_value: 10,
                is_active: false,
                applicability: 'all',
                current_uses: 0,
                total_discount_granted: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'test_min_val',
                code: 'MINIMO50',
                description: 'Mínimo de R$ 50',
                discount_type: 'fixed',
                discount_value: 10,
                min_order_value: 50,
                is_active: true,
                applicability: 'all',
                current_uses: 0,
                total_discount_granted: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'test_max_uses',
                code: 'LIMITADO1',
                description: 'Apenas 1 uso total',
                discount_type: 'fixed',
                discount_value: 10,
                max_uses: 1,
                current_uses: 0,
                total_discount_granted: 0,
                is_active: true,
                applicability: 'all',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'test_prod_restrict',
                code: 'FRUTAEXCLUSIVA',
                description: 'Válido apenas para produto fruta-dragao',
                discount_type: 'percentage',
                discount_value: 20,
                applicability: 'products',
                applicable_product_ids: ['prod-fruta-dragao'],
                is_active: true,
                current_uses: 0,
                total_discount_granted: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        ]

        // Mescla sem duplicar
        const merged = coupons.filter(c => !testCoupons.some(tc => tc.code === c.code))
        merged.push(...testCoupons)
        await saveStoredCoupons(merged)
        console.log('Cupons de teste salvos com sucesso no Supabase Storage.\n')

        // Teste 1: Validação simples via GET (ASHEN15)
        console.log('--- Teste 1: GET /api/coupons/validate?code=ashen15&subtotal=100 ---')
        const res1 = await fetch(`${BASE_URL}/api/coupons/validate?code=ashen15&subtotal=100`)
        const data1 = await res1.json()
        assert(res1.ok && data1.valid && data1.discount_amount === 15, `Cupom ASHEN15 aplicado: desconto R$ ${data1.discount_amount} (esperado 15)`)

        // Teste 2: Validação via POST com carrinho (VALE20)
        console.log('\n--- Teste 2: POST /api/coupons/validate (VALE20 - R$ 20 fixo) ---')
        const res2 = await fetch(`${BASE_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'vale20',
                subtotal: 60,
                items: [{ name: 'Gamepass', price: 60, quantity: 1 }]
            })
        })
        const data2 = await res2.json()
        assert(res2.ok && data2.valid && data2.discount_amount === 20, `Cupom VALE20 aplicado: desconto R$ ${data2.discount_amount} (esperado 20)`)

        // Teste 3: Teto Máximo (TETO30 - 50% max R$ 30)
        console.log('\n--- Teste 3: POST /api/coupons/validate (TETO30 - teto de R$ 30) ---')
        const res3 = await fetch(`${BASE_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'TETO30',
                subtotal: 100,
                items: [{ name: 'Item Caro', price: 100, quantity: 1 }]
            })
        })
        const data3 = await res3.json()
        assert(res3.ok && data3.valid && data3.discount_amount === 30, `Teto aplicado: desconto R$ ${data3.discount_amount} (esperado 30)`)

        // Teste 4: Cupom Expirado
        console.log('\n--- Teste 4: Rejeição de Cupom Expirado (VENCIDO10) ---')
        const res4 = await fetch(`${BASE_URL}/api/coupons/validate?code=VENCIDO10&subtotal=50`)
        const data4 = await res4.json()
        assert(!data4.valid && data4.error.includes('expirou'), `Cupom expirado rejeitado: "${data4.error}"`)

        // Teste 5: Cupom Inativo
        console.log('\n--- Teste 5: Rejeição de Cupom Inativo (DESATIVADO) ---')
        const res5 = await fetch(`${BASE_URL}/api/coupons/validate?code=DESATIVADO&subtotal=50`)
        const data5 = await res5.json()
        assert(!data5.valid && data5.error.includes('desativado'), `Cupom inativo rejeitado: "${data5.error}"`)

        // Teste 6: Valor Mínimo de Compra
        console.log('\n--- Teste 6: Valor Mínimo de Compra (MINIMO50) ---')
        const res6Fail = await fetch(`${BASE_URL}/api/coupons/validate?code=MINIMO50&subtotal=30`)
        const data6Fail = await res6Fail.json()
        assert(!data6Fail.valid && data6Fail.error.includes('mínimo'), `Rejeitado abaixo do mínimo: "${data6Fail.error}"`)

        const res6Pass = await fetch(`${BASE_URL}/api/coupons/validate?code=MINIMO50&subtotal=60`)
        const data6Pass = await res6Pass.json()
        assert(data6Pass.valid && data6Pass.discount_amount === 10, `Aprovado acima do mínimo (desconto R$ ${data6Pass.discount_amount})`)

        // Teste 7: Restrição por Produto
        console.log('\n--- Teste 7: Restrição por Produto (FRUTAEXCLUSIVA) ---')
        const res7Fail = await fetch(`${BASE_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'FRUTAEXCLUSIVA',
                items: [{ product_id: 'prod-outro', name: 'Outro', price: 100, quantity: 1 }]
            })
        })
        const data7Fail = await res7Fail.json()
        assert(!data7Fail.valid && data7Fail.error.includes('elegível'), `Carrinho sem produto elegível rejeitado: "${data7Fail.error}"`)

        const res7Pass = await fetch(`${BASE_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'FRUTAEXCLUSIVA',
                items: [
                    { product_id: 'prod-fruta-dragao', name: 'Fruta Dragão', price: 100, quantity: 1 },
                    { product_id: 'prod-outro', name: 'Outro', price: 50, quantity: 1 }
                ]
            })
        })
        const data7Pass = await res7Pass.json()
        assert(data7Pass.valid && data7Pass.discount_amount === 20, `Desconto aplicado apenas sobre o produto elegível: R$ ${data7Pass.discount_amount} (esperado 20)`)

        // Teste 8: Checkout com Cupom (/api/checkout/create)
        console.log('\n--- Teste 8: Criação de Pedido com Cupom via /api/checkout/create ---')
        const checkoutPayload = {
            payment_method: 'pix',
            coupon_code: 'ASHEN15',
            items: [{
                name: 'Item Teste E2E',
                price: 100,
                quantity: 1,
            }],
            customer: {
                name: 'Comprador Teste Cupom',
                email: 'testecupom@exemplo.com',
                phone: '(11) 99999-9999',
                roblox_username: 'NickRobloxTeste',
            }
        }

        const resCheckout = await fetch(`${BASE_URL}/api/checkout/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkoutPayload)
        })
        const checkoutData = await resCheckout.json()

        assert(resCheckout.ok && checkoutData.success, `Pedido criado com sucesso: ${checkoutData.order_id}`)
        assert(checkoutData.discount === 15, `Desconto de R$ 15 computado pelo servidor (total: R$ ${checkoutData.total})`)
        assert(checkoutData.pix_code && checkoutData.pix_code.length > 20, `QR Code PIX gerado com sucesso`)

        // Limpeza dos cupons de teste
        const currentCoupons = await getStoredCoupons()
        const cleaned = currentCoupons.filter(c => !testCoupons.some(tc => tc.id === c.id))
        await saveStoredCoupons(cleaned)
        console.log('\nCupons de teste limpos do storage.')

        console.log(`\n=== RESULTADO FINAL: ${passed} PASSOU, ${failed} FALHOU ===\n`)
        process.exit(failed > 0 ? 1 : 0)

    } catch (err) {
        console.error('Erro nos testes de API:', err)
        process.exit(1)
    }
}

runApiTests()
