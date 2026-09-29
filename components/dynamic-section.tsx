// Hello World
"use client"

import useSWR from "swr"
import Link from "next/link"
import { type Category, type Content } from "@/lib/supabase/types"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

interface DynamicSectionProps {
  categoryId: string
}

export function DynamicSection({ categoryId }: DynamicSectionProps) {
  const { data: category } = useSWR<Category>(`/api/categories?id=${categoryId}`, fetcher)
  const { data: contents = [] } = useSWR<Content[]>(`/api/contents?categoryId=${categoryId}`, fetcher)

  if (!category) return null

  return (
    <section id={`category-${category.slug}`} className="scroll-mt-20 py-16 bg-background border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Categoria - TÍTULO ACIMA DOS CARDS */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 tracking-tight drop-shadow-md">
            {category.name}
          </h2>
          
         

          {category.description && (
            <p className="text-lg md:text-xl text-foreground/85 max-w-3xl mx-auto leading-relaxed font-light">
              {category.description}
            </p>
          )}
        </div>

        {/* Grid de Conteúdos ABAIXO DO TÍTULO */}
        {contents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {contents.map((content) => (
              <Link key={content.id} href={`/content/${content.slug}`}>
                <article className="group h-full cursor-pointer rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  {content.image_url && (
                    <div className="relative h-56 overflow-hidden bg-primary/10">
                      <img
                        src={content.image_url}
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="text-xs text-primary font-semibold mb-3 uppercase tracking-widest">
                      📅 {new Date(content.updated_at).toLocaleDateString("pt-BR")}
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition line-clamp-2 mb-3">
                      {content.title}
                    </h3>
                    <p className="text-foreground/70 text-sm line-clamp-3 leading-relaxed">
                      {content.description}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-foreground/60">
            <p className="text-lg">Nenhum conteúdo disponível nesta categoria</p>
          </div>
        )}
      </div>
    </section>
  )
}