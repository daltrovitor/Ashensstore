import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { getSupabaseService } from '@/lib/supabase/server'
import { generatePixPayload, COMPANY_PIX_DATA } from '@/lib/pix/brcode'
import {
  RoulettePrize,
  RouletteCode,
  UserSpinsBalance,
  RouletteSpinRecord,
  PublicWinnerFeedItem,
  RouletteStatsSummary,
  RouletteSettings,
  RouletteSpinOrder,
  CodeStatus,
  ClaimStatus,
  PrizeRarity,
} from './types'
import { INITIAL_ROULETTE_PRIZES } from './seed-data'

const BUCKET_NAME = 'app_data'
const ROULETTE_FILE_NAME = 'roulette_store.json'
const DATA_DIR = path.join(process.cwd(), 'data')
const LOCAL_ROULETTE_FILE = path.join(DATA_DIR, 'roulette_store.json')

export const DEFAULT_ROULETTE_SETTINGS: RouletteSettings = {
  spin_price: 5.00,
  is_active: true,
  suspense_near_miss_enabled: true,
  banner_title: 'Roleta da Sorte Ashens',
  banner_subtitle: 'Gire e concorra a Frutas Míticas (Kitsune, Dragon), Contas Level 2550 e Gamepasses com entrega rápida e segura.',
  updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
}

interface RouletteStoreData {
  prizes: RoulettePrize[]
  codes: RouletteCode[]
  userSpins: Record<string, UserSpinsBalance>
  spinsHistory: RouletteSpinRecord[]
  settings?: RouletteSettings
  orders?: RouletteSpinOrder[]
}

let bucketEnsured = false
let cachedStore: RouletteStoreData | null = null
let lastFetchedAt = 0
const CACHE_TTL_MS = 2000

async function ensureBucket(supabase: any) {
  if (bucketEnsured) return
  try {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false })
    bucketEnsured = true
  } catch {
    bucketEnsured = true
  }
}

/**
 * Lê o estado global da roleta do Storage / Local / Memória
 */
async function readRouletteStore(forceFresh = false): Promise<RouletteStoreData> {
  const now = Date.now()
  if (!forceFresh && cachedStore && (now - lastFetchedAt < CACHE_TTL_MS)) {
    return cachedStore
  }

  // Tenta ler local primeiro se existir
  try {
    if (fs.existsSync(LOCAL_ROULETTE_FILE)) {
      const raw = fs.readFileSync(LOCAL_ROULETTE_FILE, 'utf-8')
      if (raw && raw.trim()) {
        cachedStore = JSON.parse(raw) as RouletteStoreData
        lastFetchedAt = Date.now()
        return cachedStore
      }
    }
  } catch {}

  const supabase = getSupabaseService()

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(ROULETTE_FILE_NAME)

      if (!error && data) {
        const text = await data.text()
        if (text && text.trim()) {
          cachedStore = JSON.parse(text) as RouletteStoreData
          lastFetchedAt = Date.now()
          return cachedStore
        }
      }

      if (error) {
        await ensureBucket(supabase)
        const initial: RouletteStoreData = {
          prizes: INITIAL_ROULETTE_PRIZES,
          codes: [],
          userSpins: {},
          spinsHistory: [],
          settings: DEFAULT_ROULETTE_SETTINGS,
          orders: [],
        }
        await supabase.storage
          .from(BUCKET_NAME)
          .upload(ROULETTE_FILE_NAME, JSON.stringify(initial, null, 2), {
            upsert: true,
            contentType: 'application/json',
            cacheControl: '0',
          })
        cachedStore = initial
        lastFetchedAt = Date.now()
        return initial
      }
    } catch (err) {
      console.warn('[RouletteService] Aviso ao ler do Supabase Storage:', err)
    }
  }

  const fallback: RouletteStoreData = {
    prizes: INITIAL_ROULETTE_PRIZES,
    codes: [],
    userSpins: {},
    spinsHistory: [],
    settings: DEFAULT_ROULETTE_SETTINGS,
    orders: [],
  }
  cachedStore = fallback
  lastFetchedAt = Date.now()
  return fallback
}

/**
 * Salva o estado global da roleta
 */
async function saveRouletteStore(data: RouletteStoreData): Promise<void> {
  cachedStore = data
  const jsonStr = JSON.stringify(data, null, 2)

  // Salva localmente
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(LOCAL_ROULETTE_FILE, jsonStr, 'utf-8')
  } catch {}

  const supabase = getSupabaseService()

  if (supabase) {
    try {
      let { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(ROULETTE_FILE_NAME, jsonStr, {
          upsert: true,
          contentType: 'application/json',
          cacheControl: '0',
        })

      if (error) {
        await ensureBucket(supabase)
        await supabase.storage
          .from(BUCKET_NAME)
          .upload(ROULETTE_FILE_NAME, jsonStr, {
            upsert: true,
            contentType: 'application/json',
            cacheControl: '0',
          })
      }
    } catch (err) {
      console.error('[RouletteService] Exceção ao salvar no Supabase Storage:', err)
    }
  }
}

/**
 * Gera um código legível e único (ex: ASHEN-7K9P-2M4X-5B8Z)
 */
export function generateUniqueCode(prefix = 'ASHEN'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const segment = (length: number) => {
    let result = ''
    const bytes = crypto.randomBytes(length)
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length]
    }
    return result
  }
  return `${prefix}-${segment(4)}-${segment(4)}-${segment(4)}`
}

/**
 * Gera um ID único para o giro (ex: GIR-8392-4102)
 */
export function generateSpinId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  const segment = (length: number) => {
    let result = ''
    const bytes = crypto.randomBytes(length)
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length]
    }
    return result
  }
  return `GIR-${segment(4)}-${segment(4)}`
}

/**
 * 1. Obter Configurações da Roleta
 */
export async function getRouletteSettings(): Promise<RouletteSettings> {
  const store = await readRouletteStore()
  return store.settings ? { ...DEFAULT_ROULETTE_SETTINGS, ...store.settings } : DEFAULT_ROULETTE_SETTINGS
}

/**
 * Salvar Configurações da Roleta
 */
export async function saveRouletteSettings(settings: Partial<RouletteSettings>): Promise<RouletteSettings> {
  const store = await readRouletteStore()
  const current = store.settings || DEFAULT_ROULETTE_SETTINGS

  const updated: RouletteSettings = {
    ...current,
    ...settings,
    spin_price: settings.spin_price !== undefined ? Number(settings.spin_price) : current.spin_price,
    is_active: settings.is_active !== undefined ? Boolean(settings.is_active) : current.is_active,
    suspense_near_miss_enabled: settings.suspense_near_miss_enabled !== undefined ? Boolean(settings.suspense_near_miss_enabled) : current.suspense_near_miss_enabled,
    updated_at: new Date().toISOString(),
  }

  store.settings = updated
  await saveRouletteStore(store)
  return updated
}

/**
 * 2. Obter Prêmios da Roleta
 */
export async function getRoulettePrizes(includeInactive = false): Promise<RoulettePrize[]> {
  const supabase = getSupabaseService()

  if (supabase) {
    try {
      let query = supabase.from('roulette_prizes').select('*').order('display_order', { ascending: true })
      if (!includeInactive) {
        query = query.eq('is_active', true)
      }
      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as RoulettePrize[]
      }
    } catch {
      // Fallback
    }
  }

  const store = await readRouletteStore()
  const prizes = store.prizes && store.prizes.length > 0 ? store.prizes : INITIAL_ROULETTE_PRIZES
  if (includeInactive) return prizes
  return prizes.filter(p => p.is_active)
}

/**
 * Salvar / Atualizar Prêmio
 */
export async function saveRoulettePrize(prize: Partial<RoulettePrize>): Promise<RoulettePrize> {
  const store = await readRouletteStore()
  const now = new Date().toISOString()

  const resolvedImage = prize.use_store_image && prize.image_url
    ? prize.image_url
    : (prize.custom_image_url || prize.image_url || '/placeholder.jpg')

  let updated: RoulettePrize

  if (prize.id) {
    const idx = store.prizes.findIndex(p => p.id === prize.id)
    if (idx >= 0) {
      updated = {
        ...store.prizes[idx],
        ...prize,
        image_url: resolvedImage,
        rarity: prize.rarity || store.prizes[idx].rarity || 'common',
        probability: Number(prize.probability) || store.prizes[idx].probability || 1.0,
        updated_at: now,
      } as RoulettePrize
      store.prizes[idx] = updated
    } else {
      updated = {
        id: prize.id,
        name: prize.name || 'Novo Prêmio',
        description: prize.description || '',
        image_url: resolvedImage,
        custom_image_url: prize.custom_image_url || null,
        use_store_image: Boolean(prize.use_store_image),
        product_id: prize.product_id || null,
        rarity: prize.rarity || 'common',
        probability: Number(prize.probability) || 1.0,
        redemption_type: prize.redemption_type || 'discord',
        delivery_info: prize.delivery_info || '',
        is_active: prize.is_active ?? true,
        display_order: prize.display_order ?? (store.prizes.length + 1),
        created_at: now,
        updated_at: now,
      }
      store.prizes.push(updated)
    }
  } else {
    updated = {
      id: 'prz-' + crypto.randomUUID().substring(0, 8),
      name: prize.name || 'Novo Prêmio',
      description: prize.description || '',
      image_url: resolvedImage,
      custom_image_url: prize.custom_image_url || null,
      use_store_image: Boolean(prize.use_store_image),
      product_id: prize.product_id || null,
      rarity: prize.rarity || 'common',
      probability: Number(prize.probability) || 1.0,
      redemption_type: prize.redemption_type || 'discord',
      delivery_info: prize.delivery_info || '',
      is_active: prize.is_active ?? true,
      display_order: prize.display_order ?? (store.prizes.length + 1),
      created_at: now,
      updated_at: now,
    }
    store.prizes.push(updated)
  }

  await saveRouletteStore(store)

  const supabase = getSupabaseService()
  if (supabase) {
    try {
      await supabase.from('roulette_prizes').upsert(updated)
    } catch {
      // Ignora se tabela não existir
    }
  }

  return updated
}

/**
 * Excluir Prêmio
 */
export async function deleteRoulettePrize(prizeId: string): Promise<boolean> {
  const store = await readRouletteStore()
  store.prizes = store.prizes.filter(p => p.id !== prizeId)
  await saveRouletteStore(store)

  const supabase = getSupabaseService()
  if (supabase) {
    try {
      await supabase.from('roulette_prizes').delete().eq('id', prizeId)
    } catch {
      // Ignora se tabela não existir
    }
  }

  return true
}

/**
 * 3. Saldo de Giros do Usuário
 */
export async function getUserSpinsBalance(userId: string, email: string): Promise<UserSpinsBalance> {
  const supabase = getSupabaseService()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_spins')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        return data as UserSpinsBalance
      }
    } catch {
      // Fallback
    }
  }

  const store = await readRouletteStore()
  if (store.userSpins[userId]) {
    return store.userSpins[userId]
  }

  // Tenta achar por email caso userId mude entre logins
  const byEmail = Object.values(store.userSpins).find(u => u.email && u.email.toLowerCase() === email.toLowerCase())
  if (byEmail) {
    return byEmail
  }

  const initialBalance: UserSpinsBalance = {
    user_id: userId,
    email: email,
    spins_balance: 0,
    total_spins_performed: 0,
    updated_at: new Date().toISOString(),
  }

  store.userSpins[userId] = initialBalance
  await saveRouletteStore(store)

  return initialBalance
}

/**
 * 4. Resgatar Código de Giro
 */
export async function redeemRouletteCode(params: {
  code: string
  userId: string
  userEmail: string
}): Promise<{
  success: boolean
  spinsAdded?: number
  newBalance?: number
  message: string
}> {
  const cleanCode = params.code.trim().toUpperCase()
  if (!cleanCode) {
    return { success: false, message: 'Por favor, informe o código do giro.' }
  }

  let store = await readRouletteStore()
  let codeIndex = store.codes.findIndex(c => c.code === cleanCode)

  if (codeIndex === -1) {
    store = await readRouletteStore(true)
    codeIndex = store.codes.findIndex(c => c.code === cleanCode)
  }

  if (codeIndex === -1) {
    return {
      success: false,
      message: 'Código inválido ou inexistente. Verifique se digitou corretamente.',
    }
  }

  const codeItem = store.codes[codeIndex]

  if (codeItem.status === 'used') {
    const formattedDate = codeItem.redeemed_at
      ? new Date(codeItem.redeemed_at).toLocaleDateString('pt-BR')
      : ''
    return {
      success: false,
      message: `Este código já foi resgatado anteriormente${formattedDate ? ` em ${formattedDate}` : ''}.`,
    }
  }

  if (codeItem.status === 'disabled') {
    return {
      success: false,
      message: 'Este código foi desativado pela administração.',
    }
  }

  const spinsCount = codeItem.spins_count || 1
  const now = new Date().toISOString()

  // Atualiza código
  store.codes[codeIndex] = {
    ...codeItem,
    status: 'used',
    redeemed_by_user_id: params.userId,
    redeemed_by_email: params.userEmail,
    redeemed_at: now,
  }

  // Atualiza saldo do usuário
  if (!store.userSpins[params.userId]) {
    store.userSpins[params.userId] = {
      user_id: params.userId,
      email: params.userEmail,
      spins_balance: 0,
      total_spins_performed: 0,
      updated_at: now,
    }
  }

  store.userSpins[params.userId].spins_balance += spinsCount
  store.userSpins[params.userId].updated_at = now

  const newBalance = store.userSpins[params.userId].spins_balance

  await saveRouletteStore(store)

  return {
    success: true,
    spinsAdded: spinsCount,
    newBalance,
    message: `Parabéns! ${spinsCount} ${spinsCount === 1 ? 'giro foi adicionado' : 'giros foram adicionados'} ao seu saldo.`,
  }
}

/**
 * 5. Realizar Giro (Backend-Safe Weighted Random Lottery com Near Miss)
 */
export async function performRouletteSpin(params: {
  userId: string
  userEmail: string
  userName?: string
}): Promise<{
  success: boolean
  prize?: RoulettePrize
  nearMissPrize?: RoulettePrize
  spinsRemaining?: number
  spinId?: string
  error?: string
}> {
  const store = await readRouletteStore()
  const settings = store.settings || DEFAULT_ROULETTE_SETTINGS

  if (!settings.is_active) {
    return {
      success: false,
      error: 'A roleta está temporariamente em manutenção pela administração. Tente novamente em breve!',
    }
  }

  // Busca saldo por userId ou por email
  let userBalance = store.userSpins[params.userId]
  if (!userBalance && params.userEmail) {
    const byEmail = Object.values(store.userSpins).find(u => u.email && u.email.toLowerCase() === params.userEmail.toLowerCase())
    if (byEmail) userBalance = byEmail
  }

  if (!userBalance || userBalance.spins_balance < 1) {
    return {
      success: false,
      error: 'Você não possui giros disponíveis. Adquira giros abaixo para continuar.',
    }
  }

  const activePrizes = (store.prizes && store.prizes.length > 0 ? store.prizes : INITIAL_ROULETTE_PRIZES)
    .filter(p => p.is_active)

  if (activePrizes.length === 0) {
    return {
      success: false,
      error: 'Nenhum prêmio disponível na roleta no momento.',
    }
  }

  // Desconta 1 giro
  userBalance.spins_balance -= 1
  userBalance.total_spins_performed = (userBalance.total_spins_performed || 0) + 1
  userBalance.updated_at = new Date().toISOString()

  // Sorteio Ponderado Seguro (Weighted Random)
  const totalWeight = activePrizes.reduce((sum, p) => sum + Math.round(Number(p.probability) * 100), 0)
  const randomPoint = crypto.randomInt(0, Math.max(1, totalWeight))

  let runningSum = 0
  let winningPrize: RoulettePrize = activePrizes[activePrizes.length - 1]

  for (const prize of activePrizes) {
    runningSum += Math.round(Number(prize.probability) * 100)
    if (randomPoint < runningSum) {
      winningPrize = prize
      break
    }
  }

  // Suspense "Near Miss": se o prêmio não for mítico, seleciona um mítico ou lendário para passar raspando
  let nearMissPrize: RoulettePrize | undefined = undefined
  if (settings.suspense_near_miss_enabled && winningPrize.rarity !== 'mythic') {
    const mythics = activePrizes.filter(p => p.rarity === 'mythic' && p.id !== winningPrize.id)
    if (mythics.length > 0) {
      nearMissPrize = mythics[Math.floor(Math.random() * mythics.length)]
    } else {
      const legendaries = activePrizes.filter(p => p.rarity === 'legendary' && p.id !== winningPrize.id)
      if (legendaries.length > 0) {
        nearMissPrize = legendaries[Math.floor(Math.random() * legendaries.length)]
      }
    }
  }

  const spinId = generateSpinId()
  const now = new Date().toISOString()

  // Registra histórico
  const spinRecord: RouletteSpinRecord = {
    id: 'spn-' + crypto.randomUUID().substring(0, 8),
    spin_id: spinId,
    user_id: params.userId,
    user_email: params.userEmail,
    user_name: params.userName || params.userEmail.split('@')[0],
    prize_id: winningPrize.id,
    prize_name: winningPrize.name,
    prize_image: winningPrize.image_url,
    rarity: winningPrize.rarity,
    redemption_type: winningPrize.redemption_type,
    delivery_info: winningPrize.delivery_info,
    claim_status: 'pending',
    created_at: now,
  }

  store.spinsHistory.unshift(spinRecord)

  if (store.spinsHistory.length > 1000) {
    store.spinsHistory = store.spinsHistory.slice(0, 1000)
  }

  await saveRouletteStore(store)

  return {
    success: true,
    prize: winningPrize,
    nearMissPrize,
    spinsRemaining: userBalance.spins_balance,
    spinId,
  }
}

/**
 * 6. Criação de Pedido de Compra de Giros (PIX Instantâneo)
 */
export async function createRouletteSpinOrder(params: {
  userId?: string | null
  customerName: string
  customerEmail: string
  customerPhone?: string
  robloxUsername: string
  spinsCount: number
}): Promise<RouletteSpinOrder> {
  const store = await readRouletteStore()
  const settings = store.settings || DEFAULT_ROULETTE_SETTINGS

  const unitPrice = Number(settings.spin_price) || 5.00
  const spins = Math.max(1, Math.floor(params.spinsCount))

  // Aplica desconto progressivo por quantidade se comprado em lote
  let totalAmount = Math.round(unitPrice * spins * 100) / 100
  if (spins >= 10) {
    totalAmount = Math.round(unitPrice * spins * 0.80 * 100) / 100 // 20% OFF
  } else if (spins >= 5) {
    totalAmount = Math.round(unitPrice * spins * 0.85 * 100) / 100 // 15% OFF
  } else if (spins >= 3) {
    totalAmount = Math.round(unitPrice * spins * 0.90 * 100) / 100 // 10% OFF
  }

  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderId = `GIR-${Date.now().toString().slice(-6)}-${suffix}`

  const cleanTxid = orderId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25)
  const pixCode = generatePixPayload({
    key: COMPANY_PIX_DATA.key,
    name: COMPANY_PIX_DATA.name,
    city: COMPANY_PIX_DATA.city,
    amount: totalAmount,
    txid: cleanTxid,
  })

  const newOrder: RouletteSpinOrder = {
    id: 'gord_' + crypto.randomUUID().substring(0, 8),
    order_id: orderId,
    user_id: params.userId || null,
    customer_name: params.customerName.trim(),
    customer_email: params.customerEmail.trim(),
    customer_phone: params.customerPhone?.trim(),
    roblox_username: params.robloxUsername.trim(),
    spins_count: spins,
    total_amount: totalAmount,
    status: 'pending',
    pix_code: pixCode,
    redeem_code: null,
    created_at: new Date().toISOString(),
  }

  if (!store.orders) {
    store.orders = []
  }

  store.orders.unshift(newOrder)
  await saveRouletteStore(store)

  return newOrder
}

/**
 * 7. Obter Pedidos de Giros (Admin / Histórico)
 */
export async function getRouletteSpinOrders(status?: string): Promise<RouletteSpinOrder[]> {
  const store = await readRouletteStore()
  const orders = store.orders || []
  if (!status || status === 'all') return orders
  return orders.filter(o => o.status === status)
}

/**
 * 8. Confirmar Pagamento do Pedido e Liberar Giros (Ação do Administrador)
 */
export async function confirmRouletteSpinOrder(
  orderId: string,
  adminUser = 'Admin'
): Promise<{
  success: boolean
  order?: RouletteSpinOrder
  redeemCode?: string
  newBalance?: number
  message: string
}> {
  const store = await readRouletteStore()
  if (!store.orders) store.orders = []

  const orderIndex = store.orders.findIndex(
    o => o.order_id === orderId || o.id === orderId
  )

  if (orderIndex === -1) {
    return { success: false, message: 'Pedido de giro não encontrado.' }
  }

  const order = store.orders[orderIndex]

  if (order.status === 'confirmed') {
    return {
      success: true,
      order,
      redeemCode: order.redeem_code || undefined,
      message: 'Este pedido já havia sido confirmado anteriormente.',
    }
  }

  const now = new Date().toISOString()
  const redeemCode = generateUniqueCode('GIRO')

  // Gera código de backup
  const newCodeObj: RouletteCode = {
    id: 'cod_' + crypto.randomUUID().substring(0, 8),
    code: redeemCode,
    spins_count: order.spins_count,
    status: 'active',
    created_by: `admin_order_${order.order_id}`,
    order_id: order.order_id,
    created_at: now,
  }
  store.codes.unshift(newCodeObj)

  // Credita giros automaticamente na conta do cliente
  let targetBalanceKey = order.user_id
  if (!targetBalanceKey) {
    // Procura por email
    const foundEntry = Object.entries(store.userSpins).find(
      ([_, u]) => u.email && u.email.toLowerCase() === order.customer_email.toLowerCase()
    )
    if (foundEntry) {
      targetBalanceKey = foundEntry[0]
    } else {
      targetBalanceKey = 'usr_' + crypto.randomUUID().substring(0, 8)
    }
  }

  if (!store.userSpins[targetBalanceKey]) {
    store.userSpins[targetBalanceKey] = {
      user_id: targetBalanceKey,
      email: order.customer_email,
      spins_balance: 0,
      total_spins_performed: 0,
      updated_at: now,
    }
  }

  store.userSpins[targetBalanceKey].spins_balance += order.spins_count
  store.userSpins[targetBalanceKey].updated_at = now
  const newBalance = store.userSpins[targetBalanceKey].spins_balance

  // Marca o código como já resgatado caso tenha creditado direto na conta vinculada
  if (order.user_id) {
    newCodeObj.status = 'used'
    newCodeObj.redeemed_by_user_id = order.user_id
    newCodeObj.redeemed_by_email = order.customer_email
    newCodeObj.redeemed_at = now
  }

  order.status = 'confirmed'
  order.confirmed_at = now
  order.confirmed_by = adminUser
  order.redeem_code = redeemCode

  store.orders[orderIndex] = order
  await saveRouletteStore(store)

  return {
    success: true,
    order,
    redeemCode,
    newBalance,
    message: `Pagamento confirmado com sucesso! ${order.spins_count} giros liberados para ${order.customer_name}.`,
  }
}

/**
 * 9. Creditar Giros Manualmente para Usuário
 */
export async function adminAddUserSpins(params: {
  email: string
  spinsCount: number
  userId?: string
}): Promise<{ success: boolean; newBalance: number; message: string }> {
  const store = await readRouletteStore()
  const emailClean = params.email.trim().toLowerCase()
  const spins = Math.floor(Number(params.spinsCount))

  if (!emailClean || spins <= 0) {
    return { success: false, newBalance: 0, message: 'Informe um e-mail válido e quantidade maior que zero.' }
  }

  let userKey = params.userId
  if (!userKey) {
    const entry = Object.entries(store.userSpins).find(
      ([_, u]) => u.email && u.email.toLowerCase() === emailClean
    )
    if (entry) {
      userKey = entry[0]
    } else {
      userKey = 'usr_' + crypto.randomUUID().substring(0, 8)
    }
  }

  const now = new Date().toISOString()
  if (!store.userSpins[userKey]) {
    store.userSpins[userKey] = {
      user_id: userKey,
      email: emailClean,
      spins_balance: 0,
      total_spins_performed: 0,
      updated_at: now,
    }
  }

  store.userSpins[userKey].spins_balance += spins
  store.userSpins[userKey].updated_at = now
  const newBalance = store.userSpins[userKey].spins_balance

  await saveRouletteStore(store)

  return {
    success: true,
    newBalance,
    message: `${spins} ${spins === 1 ? 'giro adicionado' : 'giros adicionados'} com sucesso para ${emailClean}! Saldo atual: ${newBalance}.`,
  }
}

/**
 * 10. Resgate de Prêmio
 */
export async function claimSpinReward(params: {
  spinId: string
  userId: string
  deliveryNotes?: string
}): Promise<{
  success: boolean
  message: string
  claimStatus: ClaimStatus
}> {
  const store = await readRouletteStore()
  const spinIndex = store.spinsHistory.findIndex(
    s => s.spin_id === params.spinId && s.user_id === params.userId
  )

  if (spinIndex === -1) {
    return { success: false, message: 'Giro não encontrado ou não pertence a este usuário.', claimStatus: 'pending' }
  }

  const spin = store.spinsHistory[spinIndex]
  const now = new Date().toISOString()

  if (spin.redemption_type === 'automatic') {
    spin.claim_status = 'claimed'
    spin.claimed_at = now
    spin.delivered_at = now
    spin.delivery_notes = params.deliveryNotes || 'Entregue automaticamente com sucesso.'
  } else {
    spin.claim_status = 'claimed'
    spin.claimed_at = now
    spin.delivery_notes = params.deliveryNotes || 'Aguardando atendimento no Discord com ID do Giro.'
  }

  store.spinsHistory[spinIndex] = spin
  await saveRouletteStore(store)

  return {
    success: true,
    message: spin.redemption_type === 'automatic'
      ? 'Prêmio resgatado e entregue com sucesso!'
      : 'Solicitação de resgate registrada! Abra um ticket no Discord da Ashens Store informando o ID do seu Giro.',
    claimStatus: spin.claim_status,
  }
}

/**
 * 11. Feed Público de Ganhadores Recentes
 */
export async function getRecentPublicWinners(limit = 15): Promise<PublicWinnerFeedItem[]> {
  const store = await readRouletteStore()
  const history = store.spinsHistory || []

  return history.slice(0, limit).map(s => {
    const rawName = s.user_name || s.user_email || 'Gamer'
    const namePart = rawName.split('@')[0]
    const masked = namePart.length > 3
      ? namePart.slice(0, 2) + '***' + namePart.slice(-1)
      : namePart + '***'

    return {
      id: s.id,
      spin_id: s.spin_id,
      masked_name: masked,
      prize_name: s.prize_name,
      prize_image: s.prize_image,
      rarity: s.rarity || 'common',
      created_at: s.created_at,
    }
  })
}

/**
 * 12. Histórico de Giros de um Usuário
 */
export async function getUserSpinHistory(userId: string): Promise<RouletteSpinRecord[]> {
  const store = await readRouletteStore()
  return (store.spinsHistory || []).filter(s => s.user_id === userId)
}

/**
 * 13. Gerar Códigos em Lote pelo Admin
 */
export async function adminCreateRouletteCodes(params: {
  quantity: number
  spinsPerCode: number
  createdBy: string
}): Promise<RouletteCode[]> {
  const store = await readRouletteStore()
  const now = new Date().toISOString()
  const created: RouletteCode[] = []

  const qty = Math.min(100, Math.max(1, params.quantity))
  const spins = Math.max(1, params.spinsPerCode)

  for (let i = 0; i < qty; i++) {
    const codeObj: RouletteCode = {
      id: 'cod_' + crypto.randomUUID().substring(0, 8),
      code: generateUniqueCode('ASHEN'),
      spins_count: spins,
      status: 'active',
      created_by: params.createdBy,
      created_at: now,
    }
    created.push(codeObj)
    store.codes.unshift(codeObj)
  }

  await saveRouletteStore(store)
  return created
}

/**
 * 14. Listar Códigos Administrativos
 */
export async function adminGetRouletteCodes(params?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{
  codes: RouletteCode[]
  total: number
  activeCount: number
  usedCount: number
  disabledCount: number
}> {
  const store = await readRouletteStore()
  const allCodes = store.codes || []

  const activeCount = allCodes.filter(c => c.status === 'active').length
  const usedCount = allCodes.filter(c => c.status === 'used').length
  const disabledCount = allCodes.filter(c => c.status === 'disabled').length

  let list = allCodes

  if (params?.status && params.status !== 'all') {
    list = list.filter(c => c.status === params.status)
  }

  if (params?.search) {
    const q = params.search.toLowerCase().trim()
    list = list.filter(
      c =>
        c.code.toLowerCase().includes(q) ||
        (c.redeemed_by_email && c.redeemed_by_email.toLowerCase().includes(q)) ||
        (c.order_id && c.order_id.toLowerCase().includes(q))
    )
  }

  const total = list.length
  const page = params?.page || 1
  const limit = params?.limit || 20
  const start = (page - 1) * limit
  const paged = list.slice(start, start + limit)

  return {
    codes: paged,
    total,
    activeCount,
    usedCount,
    disabledCount,
  }
}

/**
 * 15. Atualizar Status de um Código
 */
export async function updateCodeStatus(codeId: string, status: CodeStatus): Promise<boolean> {
  const store = await readRouletteStore()
  const idx = store.codes.findIndex(c => c.id === codeId || c.code === codeId)
  if (idx === -1) return false

  store.codes[idx].status = status
  await saveRouletteStore(store)
  return true
}

/**
 * 16. Estatísticas da Roleta
 */
export async function getAdminRouletteStats(): Promise<{
  stats: RouletteStatsSummary
  recentSpins: RouletteSpinRecord[]
}> {
  const store = await readRouletteStore()
  const history = store.spinsHistory || []
  const codes = store.codes || []
  const prizes = store.prizes || INITIAL_ROULETTE_PRIZES

  const totalSpins = history.length
  const totalCodesCreated = codes.length
  const totalCodesRedeemed = codes.filter(c => c.status === 'used').length
  const totalPrizesDelivered = history.filter(s => s.claim_status === 'delivered').length

  const countsMap: Record<string, number> = {}
  for (const s of history) {
    countsMap[s.prize_name] = (countsMap[s.prize_name] || 0) + 1
  }

  const sortedCounts = Object.entries(countsMap).map(([prize_name, count]) => ({
    prize_name,
    count,
  })).sort((a, b) => b.count - a.count)

  const mostWon = sortedCounts.slice(0, 5)
  const leastWon = [...sortedCounts].reverse().slice(0, 5)

  return {
    stats: {
      total_spins: totalSpins,
      total_codes_created: totalCodesCreated,
      total_codes_redeemed: totalCodesRedeemed,
      total_prizes_delivered: totalPrizesDelivered,
      active_prizes_count: prizes.filter(p => p.is_active).length,
      most_won_prizes: mostWon,
      least_won_prizes: leastWon,
    },
    recentSpins: history.slice(0, 50),
  }
}

/**
 * 17. Atualizar Status de Entrega
 */
export async function adminDeliverSpinReward(spinId: string, notes?: string): Promise<boolean> {
  const store = await readRouletteStore()
  const idx = store.spinsHistory.findIndex(s => s.spin_id === spinId || s.id === spinId)
  if (idx === -1) return false

  const now = new Date().toISOString()
  store.spinsHistory[idx].claim_status = 'delivered'
  store.spinsHistory[idx].delivered_at = now
  if (notes) {
    store.spinsHistory[idx].delivery_notes = notes
  }

  await saveRouletteStore(store)
  return true
}

// Aliases para compatibilidade de rotas
export const bulkGenerateSpinCodes = adminCreateRouletteCodes
export const getAdminCodes = adminGetRouletteCodes
