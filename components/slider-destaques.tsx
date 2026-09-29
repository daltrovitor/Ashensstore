// Hello World
"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import useSWR from "swr"

interface Highlight {
  id: string
  title: string
  description: string
  image_url?: string
  slug: string
}

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch")
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function SliderDestaques() {
  const { data: highlights = [] } = useSWR<Highlight[]>("/api/highlights", fetcher)
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [, setDirection] = useState<"left" | "right">("right")

  useEffect(() => {
    if (!autoPlay || !Array.isArray(highlights) || highlights.length === 0) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % highlights.length)
      setDirection("right")
    }, 6000)

    return () => clearInterval(interval)
  }, [autoPlay, highlights]) // Updated dependency array

  const next = () => {
    if (!Array.isArray(highlights) || highlights.length === 0) return
    setCurrent((prev) => (prev + 1) % highlights.length)
    setDirection("right")
    setAutoPlay(false)
  }

  const prev = () => {
    if (!Array.isArray(highlights) || highlights.length === 0) return
    setCurrent((prev) => (prev - 1 + highlights.length) % highlights.length)
    setDirection("left")
    setAutoPlay(false)
  }

  if (!Array.isArray(highlights) || highlights.length === 0) return null

  return (
    <section className="py-20 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-5xl font-bold text-foreground mb-4">Destaques</h2>
          <p className="text-foreground/60 text-lg">Conheça nossas principais ofertas e projetos</p>
        </div>

        <div className="relative rounded-2xl overflow-hidden group">
          {/* Slider container */}
          <div className="relative h-96 md:h-96 w-full overflow-hidden bg-background">
            {highlights.map((item, idx) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  idx === current ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <img
                  src={item.image_url || "/placeholder.svg?height=400&width=1200&query=psychotherapy-practice"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-accent/40 to-pink-600/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                  <h3 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-balance">{item.title}</h3>
                  <p className="text-lg md:text-xl text-white/90 max-w-2xl text-balance">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/20 hover:bg-white/40 transition group-hover:opacity-100 opacity-0 md:opacity-100 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/20 hover:bg-white/40 transition group-hover:opacity-100 opacity-0 md:opacity-100 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {highlights.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrent(idx)
                  setAutoPlay(false)
                }}
                className={`transition-all duration-300 rounded-full ${
                  idx === current ? "w-8 h-3 bg-white" : "w-3 h-3 bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
