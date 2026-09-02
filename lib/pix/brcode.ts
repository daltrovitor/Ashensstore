/**
 * Utilitário de Geração de Código PIX (BR Code / EMVCo Standard)
 * Compatível com o padrão do Banco Central do Brasil.
 */

interface PixConfig {
    key: string         // Chave PIX (ex: CNPJ "00267195000130")
    name: string        // Nome do beneficiário (máx 25 caracteres, sem acentos)
    city: string        // Cidade do beneficiário (máx 15 caracteres, sem acentos)
    amount?: number     // Valor da transação em Reais (ex: 150.00)
    txid?: string       // Identificador único da transação (ex: "ORD12345")
}

function formatTLV(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0')
    return `${id}${len}${value}`
}

function removeAccents(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, '')
}

/**
 * Cálculo de CRC-16/CCITT-FALSE (Polinômio 0x1021, Init 0xFFFF)
 */
function calculateCRC16(payload: string): string {
    let crc = 0xFFFF
    const polynomial = 0x1021

    for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8)
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ polynomial) & 0xFFFF
            } else {
                crc = (crc << 1) & 0xFFFF
            }
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function generatePixPayload(config: PixConfig): string {
    // 00: Payload Format Indicator
    let payload = formatTLV('00', '01')

    // 26: Merchant Account Information
    const cleanKey = config.key.replace(/\D/g, '') || config.key
    const gui = formatTLV('00', 'br.gov.bcb.pix')
    const key = formatTLV('01', cleanKey)
    const merchantAccountInfo = `${gui}${key}`
    payload += formatTLV('26', merchantAccountInfo)

    // 52: Merchant Category Code
    payload += formatTLV('52', '0000')

    // 53: Transaction Currency (986 = BRL)
    payload += formatTLV('53', '986')

    // 54: Transaction Amount
    if (config.amount !== undefined && config.amount > 0) {
        const formattedAmount = config.amount.toFixed(2)
        payload += formatTLV('54', formattedAmount)
    }

    // 58: Country Code
    payload += formatTLV('58', 'BR')

    // 59: Merchant Name
    const merchantName = removeAccents(config.name).substring(0, 25) || 'LIBRAS'
    payload += formatTLV('59', merchantName)

    // 60: Merchant City
    const merchantCity = removeAccents(config.city).substring(0, 15) || 'GOIANIA'
    payload += formatTLV('60', merchantCity)

    // 62: Additional Data Field Template (TXID)
    const cleanTxid = (config.txid || '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***'
    const additionalData = formatTLV('05', cleanTxid)
    payload += formatTLV('62', additionalData)

    // 63: CRC16
    payload += '6304'
    const crc = calculateCRC16(payload)

    return `${payload}${crc}`
}

export const COMPANY_PIX_DATA = {
    cnpj: '00267195000130',
    cnpjFormatted: '00.267.195/0001-30',
    name: 'LIBRAS',
    city: 'GOIANIA',
}
