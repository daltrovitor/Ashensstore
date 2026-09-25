// Hello World
import type { Category, Product } from "@/lib/store/types"
import { GAMES_DATA } from "@/lib/store/games"
import { BLOX_CATEGORIES, BLOX_PRODUCTS } from "@/data/blox-fruits"

export interface ResolvedCategoryHierarchy {
  mainCategories: Category[]
  subcategories: Category[]
  categoryMap: Map<string, Category>
  mainToSubsMap: Map<string, Category[]>
  subToMainMap: Map<string, Category>
}

/**
 * Normaliza um texto para slug sem acentos, pontuações ou emojis.
 */
export function normalizeSlug(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Detecta se uma categoria, slug ou texto refere-se a Blox Fruits.
 */
export function isBloxFruitsReference(input: string | null | undefined): boolean {
  if (!input) return false
  const clean = normalizeSlug(input)
  return (
    clean === "blox-fruits" ||
    clean === "bloxfruits" ||
    clean === "blox" ||
    clean.includes("blox-fruit") ||
    clean.includes("bloxfruit")
  )
}

/**
 * Normaliza e constrói a árvore de categorias (Principais e Subcategorias),
 * resolvendo relacionamentos pai/filho mesmo quando o parent_id estiver nulo no banco.
 */
export function buildCategoryHierarchy(rawCategories: Category[]): ResolvedCategoryHierarchy {
  const categoryMap = new Map<string, Category>()
  const mainCategories: Category[] = []
  const subcategories: Category[] = []
  const mainToSubsMap = new Map<string, Category[]>()
  const subToMainMap = new Map<string, Category>()

  // 1. Indexa categorias fornecidas
  for (const cat of rawCategories) {
    if (!cat || !cat.id) continue
    categoryMap.set(cat.id, cat)
    if (cat.slug) categoryMap.set(cat.slug, cat)
  }

  // 2. Garante que todas as categorias principais conhecidas existam
  for (const game of GAMES_DATA) {
    const existing = Array.from(categoryMap.values()).find(
      (c) =>
        (c.is_main && (c.slug === game.slug || c.id === game.id)) ||
        normalizeSlug(c.name) === normalizeSlug(game.name)
    )

    if (existing) {
      existing.is_main = true
      if (!existing.image_url && game.bannerUrl) {
        existing.image_url = game.bannerUrl
      }
    } else {
      const syntheticMain: Category = {
        id: game.id,
        name: game.name,
        slug: game.slug,
        description: game.description,
        image_url: game.bannerUrl,
        is_main: true,
        is_active: true,
        display_order: 0,
      }
      categoryMap.set(syntheticMain.id, syntheticMain)
      if (syntheticMain.slug) categoryMap.set(syntheticMain.slug, syntheticMain)
    }
  }

  // 3. Garante as subcategorias oficiais de Blox Fruits caso ainda não cadastradas
  for (const bCat of BLOX_CATEGORIES) {
    const exists = Array.from(categoryMap.values()).find(
      (c) => !c.is_main && (c.id === bCat.id || c.slug === bCat.slug || normalizeSlug(c.name) === normalizeSlug(bCat.name))
    )
    if (!exists) {
      const syntheticSub: Category = {
        ...bCat,
        is_main: false,
        is_active: true,
        parent_id: "blox-fruits",
      }
      categoryMap.set(syntheticSub.id, syntheticSub)
      if (syntheticSub.slug) categoryMap.set(syntheticSub.slug, syntheticSub)
    }
  }

  // 4. Separação de Principais e Subcategorias
  const uniqueCats = Array.from(new Set(categoryMap.values()))
  for (const cat of uniqueCats) {
    if (cat.is_main) {
      mainCategories.push(cat)
      mainToSubsMap.set(cat.id, [])
      if (cat.slug) mainToSubsMap.set(cat.slug, [])
    } else {
      subcategories.push(cat)
    }
  }

  // 5. Resolução inteligente de parent_id para cada subcategoria
  const bloxMain = mainCategories.find((c) => isBloxFruitsReference(c.slug) || isBloxFruitsReference(c.name))
  const adoptMain = mainCategories.find((c) => normalizeSlug(c.slug || c.name).includes("adopt-me"))
  const mm2Main = mainCategories.find((c) => normalizeSlug(c.slug || c.name).includes("murder-mystery") || normalizeSlug(c.slug || c.name).includes("mm2"))
  const gardenMain = mainCategories.find((c) => normalizeSlug(c.slug || c.name).includes("garden"))
  const rivalsMain = mainCategories.find((c) => normalizeSlug(c.slug || c.name).includes("rivals"))

  for (const sub of subcategories) {
    let resolvedParent: Category | undefined

    // Se já tiver parent_id explícito
    if (sub.parent_id) {
      resolvedParent = mainCategories.find(
        (m) => m.id === sub.parent_id || (m.slug && m.slug === sub.parent_id)
      )
    }

    // Inferência inteligente caso parent_id seja nulo
    if (!resolvedParent) {
      const sSlug = normalizeSlug(sub.slug || "")
      const sName = normalizeSlug(sub.name || "")

      if (
        sSlug.includes("fruta") || sName.includes("fruta") ||
        sSlug.includes("gamepass") || sName.includes("gamepass") ||
        sSlug.includes("conta") || sName.includes("conta") ||
        sSlug.includes("raca") || sName.includes("raca") ||
        sSlug.includes("devil-fruit") || isBloxFruitsReference(sSlug) || isBloxFruitsReference(sName)
      ) {
        resolvedParent = bloxMain
      } else if (sSlug.includes("pet") || sSlug.includes("adopt") || sName.includes("adopt") || sSlug.includes("pocao") || sName.includes("pocao")) {
        resolvedParent = adoptMain
      } else if (sSlug.includes("faca") || sSlug.includes("godly") || sSlug.includes("chroma") || sSlug.includes("mm2") || sName.includes("murder")) {
        resolvedParent = mm2Main
      } else if (sSlug.includes("semente") || sSlug.includes("garden") || sName.includes("garden")) {
        resolvedParent = gardenMain
      } else if (sSlug.includes("rivals") || sName.includes("rivals") || sSlug.includes("wrap")) {
        resolvedParent = rivalsMain
      }
    }

    if (resolvedParent) {
      sub.parent_id = resolvedParent.id
      subToMainMap.set(sub.id, resolvedParent)
      if (sub.slug) subToMainMap.set(sub.slug, resolvedParent)

      const list1 = mainToSubsMap.get(resolvedParent.id) || []
      list1.push(sub)
      mainToSubsMap.set(resolvedParent.id, list1)

      if (resolvedParent.slug) {
        const list2 = mainToSubsMap.get(resolvedParent.slug) || []
        list2.push(sub)
        mainToSubsMap.set(resolvedParent.slug, list2)
      }
    }
  }

  return {
    mainCategories,
    subcategories,
    categoryMap,
    mainToSubsMap,
    subToMainMap,
  }
}

/**
 * Atribui de forma determinística um produto à sua Categoria Principal (Jogo)
 * e Subcategoria (tipo de item).
 */
export function resolveProductAssignment(
  product: Product,
  hierarchy: ResolvedCategoryHierarchy
): { mainCategory: Category | null; subcategory: Category | null } {
  const pCatId = (product.category_id || "").trim()
  const pName = (product.name || "").toLowerCase()
  const pSlug = (product.slug || "").toLowerCase()
  const pDesc = (product.description || "").toLowerCase()

  // 1. Se product.category_id já aponta para uma subcategoria
  if (pCatId) {
    const directSub = hierarchy.subcategories.find(
      (s) => s.id === pCatId || (s.slug && s.slug === pCatId)
    )
    if (directSub) {
      const parentMain = hierarchy.subToMainMap.get(directSub.id) || null
      return { mainCategory: parentMain, subcategory: directSub }
    }

    // Se product.category_id aponta diretamente para uma categoria principal
    const directMain = hierarchy.mainCategories.find(
      (m) => m.id === pCatId || (m.slug && m.slug === pCatId)
    )
    if (directMain) {
      // Tenta inferir subcategoria correspondente dentro do jogo
      const subsOfMain = hierarchy.mainToSubsMap.get(directMain.id) || []
      const matchedSub = subsOfMain.find((sub) => {
        const sSlug = normalizeSlug(sub.slug || "")
        const sName = normalizeSlug(sub.name || "")
        return pName.includes(sSlug) || pName.includes(sName) || pSlug.includes(sSlug)
      })
      return { mainCategory: directMain, subcategory: matchedSub || null }
    }
  }

  // 2. Classificação semântica pelos termos do produto (Kitsune, Godhuman, Pet Adopt Me, etc.)
  const bloxKeywords = [
    "kitsune", "dragon", "leopard", "dough", "t-rex", "trex", "mammoth", "spirit",
    "venom", "shadow", "blizzard", "buddha", "portal", "sound", "rumble", "magma",
    "light", "dark blade", "fast boats", "barcos rapidos", "2x money", "2x mastery",
    "2x maestria", "2x drop", "fruit notifier", "notificador", "godhuman", "cdk",
    "cursed dual katana", "soul guitar", "level 2550", "lvl 2550", "bounty 30m",
    "v4 full gear", "cyborg v4", "shark v4", "mink v4", "human v4", "ghoul v4",
    "angel v4", "akuma no mi", "blox fruit"
  ]

  const bloxMain = hierarchy.mainCategories.find((c) => isBloxFruitsReference(c.slug) || isBloxFruitsReference(c.name)) || null
  if (bloxKeywords.some((k) => pName.includes(k) || pSlug.includes(k) || pDesc.includes(k))) {
    const bloxSubs = bloxMain ? hierarchy.mainToSubsMap.get(bloxMain.id) || [] : []
    let matchedSub: Category | null = null

    if (pName.includes("fruit") || pName.includes("fruta") || pSlug.includes("fruit") || pSlug.includes("fruta") || pName.includes("kitsune") || pName.includes("dragon") || pName.includes("leopard") || pName.includes("dough") || pName.includes("buddha")) {
      matchedSub = bloxSubs.find((s) => normalizeSlug(s.slug || s.name).includes("fruta")) || null
    } else if (pName.includes("blade") || pName.includes("pass") || pName.includes("2x ") || pName.includes("barcos") || pName.includes("notifier")) {
      matchedSub = bloxSubs.find((s) => normalizeSlug(s.slug || s.name).includes("gamepass")) || null
    } else if (pName.includes("conta") || pName.includes("account") || pName.includes("2550") || pName.includes("godhuman") || pName.includes("bounty")) {
      matchedSub = bloxSubs.find((s) => normalizeSlug(s.slug || s.name).includes("conta")) || null
    } else if (pName.includes("raca") || pName.includes("raça") || pName.includes("race") || pName.includes("v4") || pName.includes("gear")) {
      matchedSub = bloxSubs.find((s) => normalizeSlug(s.slug || s.name).includes("raca")) || null
    }

    return { mainCategory: bloxMain, subcategory: matchedSub }
  }

  // Adopt Me
  const adoptMain = hierarchy.mainCategories.find((c) => normalizeSlug(c.slug || c.name).includes("adopt-me")) || null
  if (pName.includes("adopt me") || pSlug.includes("adopt-me") || pName.includes("neon pet") || pName.includes("fly ride")) {
    const adoptSubs = adoptMain ? hierarchy.mainToSubsMap.get(adoptMain.id) || [] : []
    return { mainCategory: adoptMain, subcategory: adoptSubs[0] || null }
  }

  // Murder Mystery 2
  const mm2Main = hierarchy.mainCategories.find((c) => normalizeSlug(c.slug || c.name).includes("murder-mystery") || normalizeSlug(c.slug || c.name).includes("mm2")) || null
  if (pName.includes("mm2") || pName.includes("murder mystery") || pName.includes("godly") || pName.includes("chroma")) {
    const mm2Subs = mm2Main ? hierarchy.mainToSubsMap.get(mm2Main.id) || [] : []
    return { mainCategory: mm2Main, subcategory: mm2Subs[0] || null }
  }

  // Grow a Garden 2
  const gardenMain = hierarchy.mainCategories.find((c) => normalizeSlug(c.slug || c.name).includes("garden")) || null
  if (pName.includes("garden") || pSlug.includes("garden") || pName.includes("semente")) {
    const gardenSubs = gardenMain ? hierarchy.mainToSubsMap.get(gardenMain.id) || [] : []
    return { mainCategory: gardenMain, subcategory: gardenSubs[0] || null }
  }

  // Rivals
  const rivalsMain = hierarchy.mainCategories.find((c) => normalizeSlug(c.slug || c.name).includes("rivals")) || null
  if (pName.includes("rivals") || pSlug.includes("rivals") || pName.includes("wrap")) {
    const rivalsSubs = rivalsMain ? hierarchy.mainToSubsMap.get(rivalsMain.id) || [] : []
    return { mainCategory: rivalsMain, subcategory: rivalsSubs[0] || null }
  }

  return { mainCategory: null, subcategory: null }
}

/**
 * Filtra produtos com isolamento estrito contra poluição cruzada entre jogos.
 */
export function filterProductsByTargetCategory(
  products: Product[],
  targetCategoryIdentifier: string,
  hierarchy: ResolvedCategoryHierarchy
): Product[] {
  if (!targetCategoryIdentifier || targetCategoryIdentifier === "all") {
    return products.filter((p) => p.is_active !== false)
  }

  const cleanTarget = normalizeSlug(targetCategoryIdentifier)

  // 1. Verifica se o alvo é uma Categoria Principal (Jogo)
  const isMainTarget = hierarchy.mainCategories.find(
    (m) => m.id === targetCategoryIdentifier || normalizeSlug(m.slug || m.id || m.name) === cleanTarget
  )

  if (isMainTarget) {
    const isTargetBlox = isBloxFruitsReference(isMainTarget.slug || isMainTarget.name)

    return products.filter((p) => {
      if (p.is_active === false) return false
      const { mainCategory } = resolveProductAssignment(p, hierarchy)

      if (mainCategory) {
        if (isTargetBlox && isBloxFruitsReference(mainCategory.slug || mainCategory.name)) return true
        return mainCategory.id === isMainTarget.id || normalizeSlug(mainCategory.slug || "") === cleanTarget
      }

      // Se não resolveu mainCategory, testa correspondência direta de ID
      if (p.category_id === isMainTarget.id || p.category_id === isMainTarget.slug) return true

      return false
    })
  }

  // 2. Verifica se o alvo é uma Subcategoria específica
  const isSubTarget = hierarchy.subcategories.find(
    (s) => s.id === targetCategoryIdentifier || normalizeSlug(s.slug || s.id || s.name) === cleanTarget
  )

  if (isSubTarget) {
    return products.filter((p) => {
      if (p.is_active === false) return false
      const { subcategory } = resolveProductAssignment(p, hierarchy)
      if (subcategory) {
        return subcategory.id === isSubTarget.id || normalizeSlug(subcategory.slug || "") === cleanTarget
      }
      return p.category_id === isSubTarget.id || p.category_id === isSubTarget.slug
    })
  }

  // Fallback seguro por id direto
  return products.filter(
    (p) => p.is_active !== false && (p.category_id === targetCategoryIdentifier || p.category?.id === targetCategoryIdentifier)
  )
}
