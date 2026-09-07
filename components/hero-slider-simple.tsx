"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Slide {
  id: string
  image_url: string
  mobile_image_url?: string
  link_url?: string
  alt?: string
}

export function HeroSliderSimple() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Touch Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

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
                mobile_image_url: b.mobile_image_url || undefined,
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

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true)
    setTouchStart(e.targetTouches[0].clientX)
    setTouchEnd(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const minSwipeDistance = 45

    if (distance > minSwipeDistance) {
      goToNext()
    } else if (distance < -minSwipeDistance) {
      goToPrevious()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  if (slides.length === 0) return null

  return (
    <section className="w-full bg-white border-b border-neutral-200 select-none">
      <div
        className="relative w-full overflow-hidden bg-neutral-100 aspect-[16/9] sm:aspect-[21/8] md:aspect-[24/8] min-h-[170px] max-h-[560px] group cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              {/* Se o banner tiver imagem específica de mobile, exibe ela no celular */}
              {slide.mobile_image_url ? (
                <>
                  <div className="relative w-full h-full block sm:hidden">
                    <Image
                      src={slide.mobile_image_url}
                      alt={slide.alt || "Banner promocional"}
                      fill
                      priority={index === 0}
                      className="object-cover object-center w-full h-full"
                      sizes="100vw"
                    />
                  </div>
                  <div className="relative w-full h-full hidden sm:block">
                    <Image
                      src={slide.image_url}
                      alt={slide.alt || "Banner promocional"}
                      fill
                      priority={index === 0}
                      className="object-cover object-center w-full h-full"
                      sizes="100vw"
                    />
                  </div>
                </>
              ) : (
                <Image
                  src={slide.image_url}
                  alt={slide.alt || "Banner promocional"}
                  fill
                  priority={index === 0}
                  className="object-cover object-center w-full h-full"
                  sizes="100vw"
                />
              )}
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
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 text-neutral-800 hover:bg-white hover:text-[#48B9FA] border border-neutral-200 items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                goToNext()
              }}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 text-neutral-800 hover:bg-white hover:text-[#48B9FA] border border-neutral-200 items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicadores Minimalistas com Destaque Oficial Azul */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault()
                    setIsPaused(true)
                    setActiveIndex(index)
                  }}
                  className={`h-1 sm:h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                    index === activeIndex ? "w-5 sm:w-7 bg-[#48B9FA] shadow-sm" : "w-1.5 sm:w-2 bg-white/60 hover:bg-white"
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
