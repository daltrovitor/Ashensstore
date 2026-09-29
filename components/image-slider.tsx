// Hello World
"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import useSWR from "swr"

interface SliderImage {
  id: string
  image_url: string
  display_order: number
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

export function ImageSlider() {
  const { data: images = [] } = useSWR<SliderImage[]>("/api/highlights/images", fetcher)
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  // If there are no images from the API, fall back to two placeholders
  const sliderImages = Array.isArray(images) && images.length > 0
    ? images
    : [
        { id: 'ph-1', image_url: '/placeholder.jpg', display_order: 0 },
        { id: 'ph-2', image_url: '/placeholder.jpg', display_order: 1 },
      ]

  useEffect(() => {
    if (!autoPlay || !Array.isArray(sliderImages) || sliderImages.length === 0) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % sliderImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoPlay, images])

  const next = () => {
    if (!Array.isArray(sliderImages) || sliderImages.length === 0) return
    setCurrent((prev) => (prev + 1) % sliderImages.length)
    setAutoPlay(false)
  }

  const prev = () => {
    if (!Array.isArray(sliderImages) || sliderImages.length === 0) return
    setCurrent((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)
    setAutoPlay(false)
  }

  // use sliderImages (which includes placeholders when empty)

  return (
    <section className="py-12 bg-gradient-to-b from-primary/10 via-accent/5 to-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative rounded-xl overflow-hidden group shadow-lg">
          {/* Slider container */}
          <div className="relative h-96 md:h-96 w-full overflow-hidden bg-muted">
            {sliderImages.map((item, idx) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  idx === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              >
                <img
                  src={item.image_url}
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-primary/80 hover:bg-primary transition group-hover:opacity-100 opacity-50 md:opacity-70 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-primary-foreground" />
          </button>

          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-primary/80 hover:bg-primary transition group-hover:opacity-100 opacity-50 md:opacity-70 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-primary-foreground" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {sliderImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrent(idx)
                  setAutoPlay(false)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === current ? "bg-accent w-8" : "bg-white/50 hover:bg-white/75"
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
