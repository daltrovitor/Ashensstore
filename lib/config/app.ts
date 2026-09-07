
/**
 * App Configuration
 * Configurações globais da aplicação
 */

import { PIX_CONFIG } from './pix'

export const APP_CONFIG = {
  name: 'Ashens Store',
  slogan: 'Sua Loja Definitiva de Blox Fruits',
  
  // Modo de operação
  isTestMode: process.env.PAYMENT_MODE === 'test',

  // URLs
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // Pagamento (Exclusivo PIX)
  payment: {
    method: 'pix' as const,
    pix: PIX_CONFIG,
  },

  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Margens padrão
  margins: {
    defaultPercent: 20, // 20% padrão
    defaultFixed: 10, // R$ 10 padrão para margem fixa
  },

  // Frete
  shipping: {
    freeShippingThreshold: 200, // R$ 200 para frete grátis
    defaultShippingCost: 15, // R$ 15 frete padrão
  },
}

/**
 * Verifica se está em modo de teste
 */
export function isTestMode(): boolean {
  return APP_CONFIG.isTestMode
}

/**
 * Obtém configuração do PIX
 */
export function getPixConfig() {
  return APP_CONFIG.payment.pix
}

/**
 * Formata preço baseado no modo (em teste, adiciona prefixo)
 */
export function formatPriceForMode(price: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)

  return isTestMode() ? `TESTE: ${formatted}` : formatted
}

/**
 * Verifica se um pedido é de teste baseado no modo global
 */
export function isTestOrder(): boolean {
  return isTestMode()
}

export default APP_CONFIG
