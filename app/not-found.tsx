import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
        <span className="text-6xl sm:text-8xl font-bold text-[#48B9FA] tracking-tight mb-4">
          404
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-2">
          Página não encontrada
        </h1>
        <p className="text-sm text-neutral-500 max-w-md mb-8">
          A página ou categoria que você procurou não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white px-6 py-2.5 rounded-sm text-sm font-medium transition-colors cursor-pointer shadow-xs"
        >
          Voltar ao Início
        </Link>
      </main>

      <Footer />
    </div>
  )
}

