import React from "react"

interface CategoryDividerProps {
  title: string
  subtitle?: string
  className?: string
}

export function CategoryDivider({ title, subtitle, className = "" }: CategoryDividerProps) {
  return (
    <div className={`relative flex items-center justify-center my-6 sm:my-8 select-none ${className}`}>
      {/* Linha esquerda em destaque azul */}
      <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#48B9FA]/30 to-[#48B9FA]/80" />

      {/* Badge Central Quadrado (Estilo da foto redesenhado com bordas mais retas) */}
      <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-md bg-white border-2 border-[#48B9FA] shadow-[0_2px_12px_rgba(72,185,250,0.15)] flex flex-col items-center justify-center mx-3 sm:mx-4 shrink-0 transition-all hover:shadow-[0_2px_18px_rgba(72,185,250,0.25)]">
        <span className="text-xs sm:text-sm md:text-base font-black tracking-widest uppercase text-neutral-900">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-neutral-500 font-medium tracking-normal mt-0.5">
            {subtitle}
          </span>
        )}
      </div>

      {/* Linha direita em destaque azul */}
      <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-[#48B9FA]/30 to-[#48B9FA]/80" />
    </div>
  )
}
