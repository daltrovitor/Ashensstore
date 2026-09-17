export type RedemptionType = 'automatic' | 'discord'
export type CodeStatus = 'active' | 'used' | 'disabled'
export type ClaimStatus = 'pending' | 'claimed' | 'delivered'
export type PrizeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface RoulettePrize {
  id: string
  name: string
  description?: string
  image_url: string
  custom_image_url?: string | null
  use_store_image?: boolean
  product_id?: string | null
  rarity?: PrizeRarity
  probability: number // Porcentagem: ex 1.0 = 1%, 2.5 = 2.5%, 0.1 = 0.1%
  redemption_type: RedemptionType
  delivery_info?: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at?: string
}

export interface RouletteSettings {
  spin_price: number // Preço unitário do giro em R$ (ex: 5.00)
  is_active: boolean // Ativação geral da roleta
  suspense_near_miss_enabled: boolean // Suspense de quase cair em item mítico
  banner_title?: string
  banner_subtitle?: string
  updated_at?: string
}

export interface RouletteSpinOrder {
  id: string
  order_id: string // Ex: GIR-ORD-1789-XYZ
  user_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone?: string
  roblox_username: string
  spins_count: number
  total_amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  pix_code?: string
  redeem_code?: string | null
  created_at: string
  confirmed_at?: string | null
  confirmed_by?: string | null
}

export interface RouletteCode {
  id: string
  code: string // Ex: ASHEN-4K8P-9Z2X-1L7M
  spins_count: number // 1, 5, 10, etc.
  status: CodeStatus
  created_by: string
  order_id?: string | null
  redeemed_by_user_id?: string | null
  redeemed_by_email?: string | null
  redeemed_at?: string | null
  created_at: string
}

export interface UserSpinsBalance {
  user_id: string
  email: string
  spins_balance: number
  total_spins_performed: number
  updated_at: string
}

export interface RouletteSpinRecord {
  id: string
  spin_id: string // Ex: GIR-9283-7412
  user_id: string
  user_email: string
  user_name?: string
  prize_id?: string
  prize_name: string
  prize_image: string
  rarity?: PrizeRarity
  redemption_type: RedemptionType
  delivery_info?: string
  claim_status: ClaimStatus
  claimed_at?: string | null
  delivered_at?: string | null
  delivery_notes?: string | null
  created_at: string
}

export interface PublicWinnerFeedItem {
  id: string
  spin_id: string
  masked_name: string
  prize_name: string
  prize_image: string
  rarity?: PrizeRarity
  created_at: string
}

export interface RouletteStatsSummary {
  total_spins: number
  total_codes_created: number
  total_codes_redeemed: number
  total_prizes_delivered: number
  active_prizes_count: number
  most_won_prizes: Array<{ prize_name: string; count: number }>
  least_won_prizes: Array<{ prize_name: string; count: number }>
}
