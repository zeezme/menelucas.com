import type { Locale } from './schema/resume'

/** Configuração de publicação do site. */
export interface SiteConfig {
  /** Origem pública, sem barra final. */
  origin: string
  /** Prefixo de caminho, sempre com barras nas pontas. */
  base: string
  /** Hash do banner de compartilhamento de cada idioma; entra no nome do arquivo para que WhatsApp e LinkedIn não reaproveitem uma prévia antiga. */
  openGraphVersions?: Partial<Record<Locale, string>>
}

/** Dimensões do banner de compartilhamento (Open Graph). */
export const OPEN_GRAPH_IMAGE = { width: 1200, height: 630 } as const

const normalizeBase = (value: string): string => {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

/**
 * Lê a configuração de publicação do ambiente.
 * `SITE_URL` define a origem e `BASE_PATH` permite publicar sob um prefixo, como `/staging/`.
 */
export const siteConfig = (environment: Record<string, string | undefined> = process.env): SiteConfig => ({
  origin: (environment['SITE_URL'] ?? 'https://menelucas.com').replace(/\/+$/, ''),
  base: normalizeBase(environment['BASE_PATH'] ?? '/'),
})

/** Só a publicação na raiz é indexável; prefixos como o de staging recebem `noindex`. */
export const isIndexable = (site: SiteConfig): boolean => site.base === '/'

/** Arquivo do banner de cada idioma em `public/`, gerado por `npm run banner`. */
export const openGraphImageSource = (locale: Locale): string => `banner-${locale}.jpg`

/** Nome publicado do banner: com versão, `banner-<idioma>-<hash>.jpg`, um nome novo a cada troca. */
export const openGraphImagePath = (site: SiteConfig, locale: Locale): string => {
  const version = site.openGraphVersions?.[locale]
  return version ? `banner-${locale}-${version}.jpg` : openGraphImageSource(locale)
}
