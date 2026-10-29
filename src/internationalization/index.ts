import type { InterfaceTexts, Locale, Localized } from '../schema/resume'

/** Identificador de cada página do site. */
export type PageId = 'resume' | 'projects'

/** Função que devolve o texto de interface, no idioma da página, para uma chave de `content/ui.json`. */
export type Translator = (key: string) => string

/**
 * Devolve o texto no idioma pedido.
 * @param value Texto com uma versão por idioma.
 * @param locale Idioma desejado.
 */
export const pick = (value: Localized, locale: Locale): string => value[locale]

/**
 * Cria o tradutor dos textos de interface.
 * @param interfaceTexts Conteúdo de `content/ui.json`.
 * @param locale Idioma da página.
 * @throws Se a chave não existir em `ui.json`.
 */
export const createTranslator =
  (interfaceTexts: InterfaceTexts, locale: Locale): Translator =>
  (key) => {
    const entry = interfaceTexts[key]
    if (!entry) throw new Error(`Chave de interface ausente em ui.json: ${key}`)
    return entry[locale]
  }

/**
 * Formata `2026-02` como `02/2026` (mesmo formato dos PDFs), respeitando o idioma.
 * @param yearMonth Mês e ano no formato `AAAA-MM`.
 * @param locale Idioma desejado.
 */
export const formatYearMonth = (yearMonth: string, locale: Locale): string =>
  new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${yearMonth}-01T00:00:00Z`))

/** Primeiro segmento do título profissional, como em "Engenheiro de Software Sênior | TypeScript | ...". */
export const roleOf = (label: string): string => label.split(' | ')[0] ?? label

/** Segmentos do título profissional depois do cargo, ainda separados por " | ". */
export const labelTags = (label: string): string => label.split(' | ').slice(1).join(' | ')

/** Primeira frase do texto, incluindo o ponto final. */
export const firstSentence = (text: string): string => {
  const match = /^.+?\.(?=\s|$)/.exec(text)
  return match ? match[0] : text
}

/**
 * Escolhe o idioma a partir das preferências do navegador: `pt*` vira português e o resto, inglês.
 * A mesma regra vale para o script inline de redirecionamento.
 */
export const detectLocale = (languages: readonly string[]): Locale => (/^pt/i.test(languages[0] ?? '') ? 'pt' : 'en')

/**
 * Endereço do currículo no idioma, com barras nas pontas.
 * @param locale Idioma da página.
 * @param base Prefixo de publicação.
 */
export const localePath = (locale: Locale, base: string): string => (locale === 'pt' ? base : `${base}en/`)

/** Endereço de cada página em cada idioma, com barras nas pontas. */
export const pagePath = (page: PageId, locale: Locale, base: string): string => {
  if (page === 'resume') return localePath(locale, base)
  return locale === 'pt' ? `${base}projetos/` : `${base}en/projects/`
}

/** Caminho do arquivo gerado em `dist/` para cada página. */
export const pageFile = (page: PageId, locale: Locale): string => {
  if (page === 'resume') return locale === 'pt' ? 'index.html' : 'en/index.html'
  return locale === 'pt' ? 'projetos/index.html' : 'en/projects/index.html'
}

/** O outro idioma do site. */
export const otherLocale = (locale: Locale): Locale => (locale === 'pt' ? 'en' : 'pt')
