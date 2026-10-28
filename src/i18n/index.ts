import type { Locale, Localized, UiStrings } from '../schema/resume'

export const pick = (value: Localized, locale: Locale): string => value[locale]

/** Cria o tradutor `t(chave)` para os textos de interface de `content/ui.json`. */
export function createT(ui: UiStrings, locale: Locale) {
  return (key: string): string => {
    const entry = ui[key]
    if (!entry) throw new Error(`Chave de interface ausente em ui.json: ${key}`)
    return entry[locale]
  }
}
export type T = ReturnType<typeof createT>

/** `2026-02` → `02/2026` (mesmo formato dos PDFs), via Intl para respeitar o idioma. */
export const formatYearMonth = (ym: string, locale: Locale): string =>
  new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${ym}-01T00:00:00Z`))

/** Primeiro segmento do título ("Engenheiro de Software Sênior | ..."). */
export const roleOf = (label: string): string => label.split(' | ')[0] ?? label
export const labelTags = (label: string): string =>
  label.split(' | ').slice(1).join(' | ')

export const firstSentence = (text: string): string => {
  const match = /^.+?\.(?=\s|$)/.exec(text)
  return match ? match[0] : text
}

/** pt* → PT, qualquer outro → EN (mesma regra do script inline da página). */
export const detectLocale = (languages: readonly string[]): Locale =>
  /^pt/i.test(languages[0] ?? '') ? 'pt' : 'en'

export const otherLocale = (locale: Locale): Locale => (locale === 'pt' ? 'en' : 'pt')

export const localePath = (locale: Locale, base: string): string =>
  locale === 'pt' ? base : `${base}en/`
