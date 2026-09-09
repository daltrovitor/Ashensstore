/**
 * Utilitário universal para correspondência e resolução de categorias no Ashens Store.
 * Garante que qualquer link de categoria (slug original, slug com acento/emoji, 
 * slug normalizado, ID UUID ou sinônimos como 'frutas', 'gamepasses', 'racas')
 * seja mapeado com precisão para a categoria correta.
 */

export interface CategoryLike {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  display_order?: number | null
}

/**
 * Normaliza um texto para slug removendo emojis, acentos e caracteres especiais.
 * Ex: "🍏 Frutas no Inventário" -> "frutas-no-inventario"
 *     "Raças V4" -> "racas-v4"
 *     "🔥 PROMOÇÃO RELAMPAGO – APENAS HOJE" -> "promocao-relampago-apenas-hoje"
 *     "GAMEPASS" -> "gamepass"
 */
export function normalizeCategorySlug(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "") // Remove emojis
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Substitui espaços e especiais por hífen
    .replace(/^-+|-+$/g, "") // Remove hifens nas pontas
}

/**
 * Mapeamento de sinônimos/aliases comuns para categorias de Blox Fruits.
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
  frutas: ["fruta", "fruits", "fruit", "frutas-fisicas", "frutas-miticas", "frutas-no-inventario", "inventario"],
  gamepasses: ["gamepass", "passes", "game-pass", "game-passes"],
  contas: ["conta", "contas-pvp", "accounts", "account", "pvp"],
  racas: ["raca", "racas-v4", "raca-v4", "v4", "races", "race"],
  populares: ["popular", "destaques", "destaque", "mais-vendidos"],
  promocao: ["promocoes", "promo", "ofertas", "oferta", "relampago"],
  update: ["magnetic", "magnetic-fruit", "atualizacao", "box"],
}

/**
 * Verifica se uma categoria corresponde a um parâmetro de busca.
 */
export function matchesCategory(cat: CategoryLike, queryParam: string | null | undefined): boolean {
  if (!queryParam || queryParam === "all") return false

  const rawQuery = decodeURIComponent(queryParam).trim()
  const lowerQuery = rawQuery.toLowerCase()
  const cleanQuery = normalizeCategorySlug(rawQuery)

  // 1. Comparação direta por ID (UUID)
  if (cat.id && cat.id.toLowerCase() === lowerQuery) {
    return true
  }

  // 2. Comparação exata por Slug (case-insensitive)
  if (cat.slug && cat.slug.toLowerCase() === lowerQuery) {
    return true
  }

  // 3. Comparação por Slug Normalizado
  const cleanCatSlug = cat.slug ? normalizeCategorySlug(cat.slug) : ""
  if (cleanCatSlug && cleanCatSlug === cleanQuery) {
    return true
  }

  // 4. Comparação por Nome Normalizado
  const cleanCatName = normalizeCategorySlug(cat.name)
  if (cleanCatName === cleanQuery) {
    return true
  }

  // Desconsidera a palavra da marca 'bloxfruits' / 'blox-fruits' para checar 'frutas'
  const nameWithoutStoreBrand = cleanCatName.replace(/blox-?fruits?/g, "")
  const slugWithoutStoreBrand = cleanCatSlug.replace(/blox-?fruits?/g, "")

  // 5. Comparação por Aliases
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
    const isQueryAlias = cleanQuery === canonical || aliases.includes(cleanQuery)
    if (isQueryAlias) {
      if (canonical === "frutas") {
        if (nameWithoutStoreBrand.includes("fruta") || slugWithoutStoreBrand.includes("fruta")) {
          return true
        }
      } else {
        const matchesCanonical = cleanCatSlug.includes(canonical) || cleanCatName.includes(canonical)
        const matchesAnyAlias = aliases.some(
          (alias) => cleanCatSlug.includes(alias) || cleanCatName.includes(alias)
        )
        if (matchesCanonical || matchesAnyAlias) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Encontra a categoria mais adequada a partir de uma lista de categorias.
 */
export function findCategory<T extends CategoryLike>(
  categories: T[],
  queryParam: string | null | undefined
): T | null {
  if (!queryParam || queryParam === "all" || !categories || categories.length === 0) {
    return null
  }

  const rawQuery = decodeURIComponent(queryParam).trim()
  const lowerQuery = rawQuery.toLowerCase()
  const cleanQuery = normalizeCategorySlug(rawQuery)

  // 1. Tenta correspondência exata por ID
  const byId = categories.find((c) => c.id.toLowerCase() === lowerQuery)
  if (byId) return byId

  // 2. Tenta correspondência exata por Slug
  const byExactSlug = categories.find((c) => c.slug && c.slug.toLowerCase() === lowerQuery)
  if (byExactSlug) return byExactSlug

  // 3. Tenta correspondência por Slug normalizado
  const byCleanSlug = categories.find((c) => c.slug && normalizeCategorySlug(c.slug) === cleanQuery)
  if (byCleanSlug) return byCleanSlug

  // 4. Tenta correspondência por Nome normalizado
  const byCleanName = categories.find((c) => normalizeCategorySlug(c.name) === cleanQuery)
  if (byCleanName) return byCleanName

  // 5. Tenta correspondência por Aliases
  const byAlias = categories.find((c) => matchesCategory(c, queryParam))
  if (byAlias) return byAlias

  return null
}
