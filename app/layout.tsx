import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { CartProvider } from '@/hooks/use-shopping-cart'

const SITE_NAME = 'Ashens Store | Loja de Blox Fruits'
const SITE_DESCRIPTION = 'Sua loja definitiva de Blox Fruits! Frutas Míticas (Kitsune, Dragon, Leopard), Gamepasses com desconto, Contas Level 2550 e Raças V4. Entrega rápida no Roblox e 100% segura via PIX.'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ashenstore.com.br'

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | Ashens Store`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Blox Fruits',
    'Roblox',
    'Frutas Míticas Blox Fruits',
    'Kitsune Fruit',
    'Dragon Fruit',
    'Leopard Fruit',
    'Gamepasses Blox Fruits',
    'Contas Blox Fruits',
    'Raças V4 Blox Fruits',
    'Ashens Store',
    'Loja Blox Fruits Barata',
    'Comprar Fruta Blox Fruits PIX',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: 'Ashens Store',
    url: SITE_URL,
    images: [
      {
        url: '/ashens-logo.jpg',
        width: 1024,
        height: 1024,
        alt: 'Ashens Store - Blox Fruits',
      },
    ],
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/ashens-logo.jpg'],
  },
  icons: {
    icon: '/ashens-logo.jpg',
    apple: '/ashens-logo.jpg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "name": "Ashens Store",
    "description": SITE_DESCRIPTION,
    "url": SITE_URL,
    "logo": `${SITE_URL}/ashens-logo.jpg`,
    "image": `${SITE_URL}/ashens-logo.jpg`,
    "priceRange": "$$"
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased bg-white selection:bg-[#48B9FA]/20 selection:text-neutral-900 text-neutral-900 flex flex-col min-h-screen">
        <CartProvider>
          <div className="flex-1 flex flex-col bg-white">
            {children}
          </div>
          {process.env.NODE_ENV === 'production' && <Analytics />}
          <Toaster />
          <SonnerToaster richColors position="top-right" theme="light" />
        </CartProvider>
      </body>
    </html>
  )
}
