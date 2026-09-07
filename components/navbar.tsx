"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Menu, X, Search, User, LogOut, Settings, MessageSquare, ShoppingBag, Package, Gift } from "lucide-react"
import { FaDiscord } from "react-icons/fa"
import { CartIcon, CartDrawer } from "@/components/ecommerce/Cart"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AnimatePresence, motion } from "framer-motion"

function NavbarContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; slug: string }[]>([])

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, signOut } = useAuth()

  useEffect(() => {
    let isMounted = true
    async function loadNavbarCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data)) {
            setDbCategories(data)
          }
        }
      } catch (err) {
        console.error('Navbar: erro ao carregar categorias:', err)
      }
    }
    loadNavbarCategories()
    return () => { isMounted = false }
  }, [])

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Catálogo", href: "/loja" },
    { name: "Afiliados", href: "/afiliados" },
  ]

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false
    if (href.includes('?')) {
      const [path, query] = href.split('?')
      if (pathname !== path) return false
      const linkParams = new URLSearchParams(query)
      for (const [key, value] of Array.from(linkParams.entries())) {
        if (searchParams.get(key) !== value) return false
      }
      return true
    }
    if (href === '/loja') {
      if (pathname !== href) return false
      if (searchParams.get('categoryId')) return false
      return true
    }
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Lado Esquerdo: Logo Oficial e Links com espaçamento amplo */}
            <div className="flex items-center gap-8 lg:gap-12">
              <Link
                href="/"
                className="flex items-center transition-opacity hover:opacity-80 shrink-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 overflow-hidden flex items-center justify-center shrink-0">
                  <Image
                    src="/ashens-logo.jpg"
                    alt="Logo Oficial"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
              </Link>

              {/* Navegação Desktop Limpa (Apenas Início, Catálogo e Afiliados) */}
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm tracking-normal transition-colors py-1 cursor-pointer ${
                      isActive(link.href)
                        ? "text-[#48B9FA] font-semibold border-b-2 border-[#48B9FA] -mb-[2px]"
                        : "text-neutral-600 hover:text-[#48B9FA] font-medium"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Ações à Direita: Busca, Carrinho e Conta */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Campo de Busca Discreto */}
              {searchOpen ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (searchQuery.trim()) {
                      router.push(`/loja?search=${encodeURIComponent(searchQuery)}`)
                      setSearchOpen(false)
                    }
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar itens..."
                    className="w-36 sm:w-56 bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-black"
                    autoFocus
                    onBlur={() => setTimeout(() => setSearchOpen(false), 250)}
                  />
                  <button type="submit" className="absolute right-2 text-neutral-500 hover:text-black">
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-neutral-600 hover:text-black transition-colors"
                  aria-label="Buscar produtos"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Carrinho Minimalista */}
              <CartIcon />

              {/* Botão Discord Oficial */}
              <a
                href="https://discord.gg/gVVd46ZGKH"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 bg-[#5865F2]/10 hover:bg-[#5865F2] text-[#5865F2] hover:text-white px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-200 border border-[#5865F2]/20 cursor-pointer shadow-2xs"
                title="Entrar no Servidor Oficial do Discord"
              >
                <FaDiscord className="w-3.5 h-3.5" />
                <span>Discord</span>
              </a>

              {/* Menu do Usuário / Perfil */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-neutral-600 hover:text-black transition-colors cursor-pointer" aria-label="Conta e Perfil">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border border-neutral-200 text-neutral-900 rounded-sm p-1 shadow-lg" align="end">
                  {user ? (
                    <>
                      <DropdownMenuLabel className="font-normal text-xs text-neutral-500 px-3 py-2">
                        Conectado como <strong className="text-black block truncate">{user.full_name || user.email}</strong>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-neutral-100" />
                      <DropdownMenuItem asChild>
                        <Link href="/perfil" className="w-full cursor-pointer flex items-center gap-2 text-xs py-2 px-3 hover:bg-neutral-50">
                          <User className="w-4 h-4 text-neutral-500" />
                          Meu Perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/pedidos" className="w-full cursor-pointer flex items-center gap-2 text-xs py-2 px-3 hover:bg-neutral-50">
                          <Package className="w-4 h-4 text-neutral-500" />
                          Acompanhar Pedido
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/afiliados" className="w-full cursor-pointer flex items-center gap-2 text-xs py-2 px-3 hover:bg-neutral-50 text-neutral-900 font-medium">
                          <Gift className="w-4 h-4 text-[#48B9FA]" />
                          Área do Afiliado (10% OFF)
                        </Link>
                      </DropdownMenuItem>
                      {(user.role === 'admin' || user.role === 'manager') && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="w-full cursor-pointer flex items-center gap-2 text-xs py-2 px-3 text-black font-semibold hover:bg-neutral-50">
                            <Settings className="w-4 h-4" />
                            Painel do Vendedor
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-neutral-100" />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer text-xs py-2 px-3 hover:bg-red-50">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel className="font-normal text-xs text-neutral-500 px-3 py-2">
                        Minha Conta
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-neutral-100" />
                      <DropdownMenuItem asChild>
                        <Link href="/pedidos" className="w-full cursor-pointer flex items-center gap-2 text-xs py-2 px-3 hover:bg-neutral-50">
                          <Package className="w-4 h-4 text-neutral-500" />
                          Acompanhar Pedido
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/afiliados" className="w-full cursor-pointer flex items-center gap-2 text-xs py-2 px-3 hover:bg-neutral-50 text-neutral-900 font-medium">
                          <Gift className="w-4 h-4 text-[#48B9FA]" />
                          Seja um Afiliado (10%)
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-neutral-100" />
                      <DropdownMenuItem asChild>
                        <Link href="/login" className="w-full cursor-pointer flex items-center gap-2 text-xs py-2 px-3 hover:bg-neutral-50">
                          Entrar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/signup" className="w-full cursor-pointer flex items-center gap-2 text-xs py-2 px-3 font-semibold text-[#48B9FA] hover:bg-neutral-50">
                          Cadastrar
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {!user && (
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <Link
                    href="/login"
                    className="text-neutral-600 hover:text-black font-medium transition-colors cursor-pointer"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white px-3.5 py-1.5 rounded-sm font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}

              {/* Botão Hambúrguer Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                aria-label="Abrir Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile Minimalista */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-neutral-200 px-4 py-4 space-y-2"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-sm py-2 px-3 rounded-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-neutral-100 text-black font-semibold"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-3 border-t border-neutral-100 space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/perfil"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-neutral-800 p-2 rounded-sm hover:bg-neutral-50"
                    >
                      <User className="w-4 h-4 text-neutral-500" />
                      Meu Perfil
                    </Link>
                    <Link
                      href="/pedidos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-neutral-800 p-2 rounded-sm hover:bg-neutral-50"
                    >
                      <Package className="w-4 h-4 text-neutral-500" />
                      Acompanhar Pedido
                    </Link>
                    <Link
                      href="/afiliados"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-neutral-800 p-2 rounded-sm hover:bg-neutral-50"
                    >
                      <Gift className="w-4 h-4 text-[#48B9FA]" />
                      Área do Afiliado
                    </Link>
                    {(user.role === 'admin' || user.role === 'manager') && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-sm text-neutral-900 font-semibold p-2 rounded-sm hover:bg-neutral-50"
                      >
                        <Settings className="w-4 h-4 text-neutral-500" />
                        Painel do Vendedor
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 w-full text-left text-sm text-red-600 p-2 rounded-sm hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/pedidos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-neutral-800 p-2 rounded-sm hover:bg-neutral-50"
                    >
                      <Package className="w-4 h-4 text-neutral-500" />
                      Acompanhar Pedido
                    </Link>
                    <div className="flex gap-2 pt-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-1/2 text-center py-2 text-xs border border-neutral-300 rounded-sm text-neutral-800 font-medium hover:bg-neutral-50"
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-1/2 text-center py-2 text-xs bg-[#48B9FA] hover:bg-[#20a6f5] text-white rounded-sm font-medium transition-colors cursor-pointer"
                      >
                        Cadastrar
                      </Link>
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <a
                    href="https://discord.gg/gVVd46ZGKH"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-sm text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <FaDiscord className="w-4 h-4" />
                    <span>Entrar no Discord Oficial</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  )
}

export function Navbar() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 h-16 sm:h-20" />
    }>
      <NavbarContent />
    </Suspense>
  )
}
