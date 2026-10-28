/** Configuração de publicação. `BASE_PATH` permite publicar em um prefixo (ex.: /staging/). */
const normalizeBase = (value: string): string => {
  const withLeading = value.startsWith('/') ? value : `/${value}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

export interface SiteConfig {
  /** Origem pública, sem barra final. */
  origin: string
  /** Prefixo de caminho, sempre com barras nas pontas. */
  base: string
}

export const siteConfig = (env: Record<string, string | undefined> = process.env): SiteConfig => ({
  origin: (env['SITE_URL'] ?? 'https://menelucas.com').replace(/\/+$/, ''),
  base: normalizeBase(env['BASE_PATH'] ?? '/'),
})

export const OG_IMAGE = { path: 'banner.jpg', width: 1200, height: 630 } as const
