export interface GameCategory {
  id: string
  name: string
  slug: string
  aliases: string[]
  bannerUrl: string
  description: string
  tag?: string
  color?: string
  hasProducts: boolean
}

export const GAMES_DATA: GameCategory[] = [
  {
    id: "blox-fruits",
    name: "Blox Fruits",
    slug: "blox-fruits",
    aliases: ["bloxfruits", "BloxFruits", "blox-fruits", "blox"],
    bannerUrl: "/games/blox-fruits.png",
    description: "Frutas permanentes, físicas, gamepasses, raças V4 e contas PVP com entrega rápida via Pix.",
    tag: "MAIS POPULAR 🔥",
    color: "from-purple-600 to-indigo-600",
    hasProducts: true,
  },
  {
    id: "adopt-me",
    name: "Adopt Me!",
    slug: "adopt-me",
    aliases: ["adopt-me!", "adoptme", "adopt-me"],
    bannerUrl: "/games/adopt-me.png",
    description: "Pets lendários, poções de voar e montar e itens raros do Adopt Me com entrega segura.",
    tag: "DESTAQUE ✨",
    color: "from-pink-500 to-rose-500",
    hasProducts: false,
  },
  {
    id: "grow-a-garden-2",
    name: "Grow a Garden 2",
    slug: "grow-a-garden-2",
    aliases: ["grow-a-garden", "growagarden", "grow-a-garden-2", "gag2"],
    bannerUrl: "/games/grow-a-garden.png",
    description: "Sementes raras, pets exclusivos, gears e combos especiais para Grow a Garden 2.",
    tag: "NOVO 🌿",
    color: "from-emerald-500 to-teal-500",
    hasProducts: false,
  },
  {
    id: "murder-mystery-2",
    name: "Murder Mystery 2",
    slug: "murder-mystery-2",
    aliases: ["murder-mystery-2", "mm2", "murdermystery2", "murder-mystery"],
    bannerUrl: "/games/murder-mystery-2.png",
    description: "Facas raras, armas godlys, chromas e conjuntos raros do Murder Mystery 2.",
    tag: "POPULAR 🔪",
    color: "from-red-600 to-amber-600",
    hasProducts: false,
  },
  {
    id: "rivals",
    name: "Rivals",
    slug: "rivals",
    aliases: ["rivals", "roblox-rivals"],
    bannerUrl: "/games/rivals.png",
    description: "Gamepasses, chaves, wraps e itens exclusivos para o Rivals.",
    tag: "FPS 🎯",
    color: "from-blue-600 to-cyan-500",
    hasProducts: false,
  },
]

export function getAllGames(): GameCategory[] {
  return GAMES_DATA
}

export function getGameBySlug(slug: string): GameCategory | undefined {
  if (!slug) return undefined
  const clean = slug.toLowerCase().trim()
  return GAMES_DATA.find(
    (g) => g.slug.toLowerCase() === clean || g.aliases.some((a) => a.toLowerCase() === clean)
  )
}
