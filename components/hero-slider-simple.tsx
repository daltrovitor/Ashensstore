"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Slide {
  id: string
  image_url: string
  link_url?: string
  alt?: string
}

export function HeroSliderSimple() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/admin/banners", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const activeDbBanners = data
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((b: any) => b.active !== false && b.image_url)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((b: any, index: number) => ({
                id: b.id || `db-${index}`,
                image_url: b.image_url,
                link_url: b.link_url || "/loja",
                alt: b.title || "Banner",
              }))

            setSlides(activeDbBanners)
          }
        }
      } catch {
        setSlides([])
      } finally {
        setLoaded(true)
      }
    }

    fetchBanners()
  }, [])

  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isPaused, slides.length])

  const goToPrevious = () => {
    setIsPaused(true)
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setIsPaused(true)
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }

  if (slides.length === 0) return null

  return (
    <section className="w-full bg-white border-b border-neutral-200">
      <div
        className="relative w-full overflow-hidden bg-neutral-100 aspect-[16/8] sm:aspect-[21/8] md:aspect-[24/8] min-h-[240px] max-h-[560px] group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((slide, index) => {
          const isActive = index === activeIndex
          const content = (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={slide.image_url}
                alt={slide.alt || "Banner promocional"}
                fill
                priority={index === 0}
                className="object-cover w-full h-full"
                sizes="100vw"
              />
            </div>
          )

          if (slide.link_url) {
            return (
              <Link key={slide.id} href={slide.link_url} className="block w-full h-full">
                {content}
              </Link>
            )
          }

          return content
        })}

        {/* Setas Sutis de Navegação */}
        {slides.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                goToPrevious()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 text-neutral-800 hover:bg-white hover:text-blue-600 border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                goToNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 text-neutral-800 hover:bg-white hover:text-blue-600 border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicadores Minimalistas com Destaque Azul */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-full">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault()
                    setIsPaused(true)
                    setActiveIndex(index)
                  }}
                  className={`h-1.5 transition-all duration-300 rounded-full ${
                    index === activeIndex ? "w-7 bg-blue-500 shadow-sm" : "w-2 bg-white/60 hover:bg-white"
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
