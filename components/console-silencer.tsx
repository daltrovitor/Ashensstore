// Hello World
"use client"

import { useEffect } from "react"

/**
 * ConsoleSilencer
 * Neutraliza completamente qualquer saída para o console do navegador
 * (console.log, console.error, console.warn, console.info, console.debug)
 * impedindo o vazamento de rotas, payloads, erros e detalhes de backend.
 */
export function ConsoleSilencer() {
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const noop = () => {}
      window.console.log = noop
      window.console.info = noop
      window.console.warn = noop
      window.console.error = noop
      window.console.debug = noop
      window.console.trace = noop
      window.console.dir = noop
      window.console.table = noop
    } catch (_) {}
  }, [])

  return null
}
