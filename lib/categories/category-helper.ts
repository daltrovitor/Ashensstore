import type { Category } from "@/lib/store/types"

export interface CategoryMetadata {
  raw_description?: string
  is_main: boolean
  image_url?: string | null
  parent_id?: string | null
}

/**
 * Serializa os metadados (tipo principal, imagem e pai hierárquico)
 * no campo description para persistência segura mesmo sem migração prévia de banco.
 */
export function serializeCategoryDescription(
  descriptionText: string | undefined | null,
  meta: { is_main?: boolean; image_url?: string | null; parent_id?: string | null }
): string {
  const cleanText = (descriptionText || "").trim()

  return JSON.stringify({
    text: cleanText,
    is_main: Boolean(meta.is_main),
    image_url: meta.image_url ? String(meta.image_url).trim() : null,
    parent_id: meta.parent_id ? String(meta.parent_id).trim() : null,
  })
}

/**
 * Normaliza e extrai os campos hierárquicos e de imagem a partir do registro do banco.
 */
export function parseCategoryRecord(rawCat: any): Category {
  if (!rawCat) return rawCat

  let is_main = false
  let image_url: string | null = null
  let parent_id: string | null = null
  let description = rawCat.description || ""

  // Tenta extrair JSON embutido na descrição
  if (rawCat.description && typeof rawCat.description === "string") {
    try {
      const parsed = JSON.parse(rawCat.description)
      if (
        parsed &&
        typeof parsed === "object" &&
        ("is_main" in parsed || "parent_id" in parsed || "image_url" in parsed)
      ) {
        is_main = Boolean(parsed.is_main)
        if (parsed.image_url !== undefined) image_url = parsed.image_url
        if (parsed.parent_id !== undefined) parent_id = parsed.parent_id
        description = parsed.text || ""
      }
    } catch {
      // Descrição em texto plano comum
      description = rawCat.description
    }
  }

  // Se houver colunas nativas no banco, têm precedência
  if (rawCat.is_main !== undefined && rawCat.is_main !== null) {
    is_main = Boolean(rawCat.is_main)
  }
  if (rawCat.parent_id !== undefined && rawCat.parent_id !== null) {
    parent_id = rawCat.parent_id
  }
  if (rawCat.image_url !== undefined && rawCat.image_url !== null) {
    image_url = rawCat.image_url
  }

  return {
    id: rawCat.id,
    name: rawCat.name,
    slug: rawCat.slug,
    description: description,
    display_order: Number(rawCat.display_order) || 0,
    is_active: rawCat.is_active !== false,
    is_main,
    image_url,
    parent_id,
  }
}
