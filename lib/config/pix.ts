/**
 * Configuração Centralizada do PIX - Ashens Store
 * Chave e dados do beneficiário para recebimento de pagamentos
 */

export const PIX_CONFIG = {
  // Chave PIX padrão da loja (pode ser sobrescrita via variável de ambiente)
  key: process.env.NEXT_PUBLIC_PIX_KEY || '05872020171',
  
  // Nome do beneficiário (máximo 25 caracteres para compatibilidade com EMVCo BR Code)
  name: process.env.NEXT_PUBLIC_PIX_NAME || 'ASHENS STORE',
  
  // Cidade do beneficiário (máximo 15 caracteres)
  city: process.env.NEXT_PUBLIC_PIX_CITY || 'SAO PAULO',

  // Tipo da chave
  keyType: 'cpf',

  // Chave formatada para exibição amigável
  get formattedKey(): string {
    const raw = this.key.replace(/\D/g, '')
    if (raw.length === 11) {
      // CPF: 000.000.000-00
      return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    if (raw.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return this.key
  }
}

export default PIX_CONFIG
