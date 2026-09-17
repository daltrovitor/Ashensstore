const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sbpgoiania.com.br'

function formatDate() {
  return new Date().toISOString()
}

export async function GET() {
  // Static sitemap to avoid importing heavy server deps during build
  const routes = [
    '/',
    '/loja',
    '/termos',
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map((route) => {
      return `  <url>\n    <loc>${SITE_URL}${route}</loc>\n    <lastmod>${formatDate()}</lastmod>\n  </url>`
    }).join('\n') +
    `\n</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
    },
  })
}
