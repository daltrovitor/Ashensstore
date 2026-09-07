"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { type Content } from "@/lib/supabase/types"

interface ContentPageProps {
  params: Promise<{ slug: string }>
}

function ContentPageContent({ params }: ContentPageProps) {
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setSlug(resolvedParams.slug)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!slug) return

    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/contents?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
        if (!response.ok) throw new Error("Content not found")
        const data = await response.json()
        setContent(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar conteúdo")
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [slug])

  if (loading) {
    return (
      <main className="bg-background">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-foreground">Carregando...</div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !content) {
    return (
      <main className="bg-background">
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Conteúdo não encontrado</h1>
          <p className="text-foreground/60 mb-6">{error || "O conteúdo que você está procurando não existe."}</p>
          <Button asChild>
            <Link href="/">Voltar à página inicial</Link>
          </Button>
        </div>
        <Footer />
      </main>
    )
  }

  // normalize category display: support array, object or fallback strings
  const categoryName = (() => {
    const c = (content as any)?.categories
    if (Array.isArray(c) && c.length) return c[0]?.name || c[0]?.title || String(c[0])
    if (c && typeof c === "object") return c.name || c.title || String(c)
    return (content as any)?.category_name || (content as any)?.category || "Não tem categoria"
  })()

  return (
    <main className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section (fallback to placeholder.jpg when no image) */}
      <div className="w-full h-80 md:h-96 overflow-hidden relative bg-neutral-100">
        <img
          src={content.image_url || "/placeholder.jpg"}
          alt={content.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Blog Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <article className="lg:col-span-2">

            {/* Article Header */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-[#48B9FA] uppercase tracking-wide">Artigo</span>
                <span className="text-sm text-neutral-400">•</span>
                <time className="text-sm text-neutral-500">
                  {new Date(content.updated_at).toLocaleDateString("pt-BR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
                {content.title}
              </h1>

              {content.description && (
                <p className="text-lg text-neutral-600 leading-relaxed">
                  {content.description}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-200 mb-10"></div>

            {/* Article Content */}
            {content.content && (
              <div className="prose prose-invert max-w-none mb-12">
                <div className="text-lg text-foreground/80 leading-relaxed space-y-6 font-light">
                  {content.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="first-letter:text-2xl first-letter:font-semibold first-letter:text-primary">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Article Footer */}
            <div className="border-t border-border pt-8 mt-12">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60 mb-2">Última atualização</p>
                  <time className="text-sm font-medium text-foreground">
                    {new Date(content.updated_at).toLocaleDateString("pt-BR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                  <Link href="/">← Voltar</Link>
                </Button>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-8">

              {/* Info Box */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Sobre este artigo</h3>
                <div className="space-y-4 text-sm text-foreground/70">
                  <div>
                    <p className="text-foreground/50 text-xs uppercase tracking-wide mb-1">Publicado em</p>
                    <p className="font-medium">
                      {new Date(content.updated_at).toLocaleDateString("pt-BR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground/50 text-xs uppercase tracking-wide mb-1">Categoria</p>
                    <p className="font-medium text-primary">{categoryName}</p>
                  </div>
                  <div>
                    <p className="text-foreground/50 text-xs uppercase tracking-wide mb-1">Leitura</p>
                    <p className="font-medium">{Math.ceil((content.content?.length || 0) / 200)} min</p>
                  </div>
                </div>
              </div>

              {/* CTA Box */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-3">Tem dúvidas?</h3>
                <p className="text-sm text-foreground/70 mb-4">
                  Entre em contato conosco para mais informações.
                </p>
                <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90">
                  <Link href="https://api.whatsapp.com/send/?phone=5562994423723&text&type=phone_number&app_absent=0">Contate-nos</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default function ContentPage(props: ContentPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ContentPageContent {...props} />
    </Suspense>
  )
}