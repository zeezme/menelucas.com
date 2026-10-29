import { pick } from '../internationalization'
import type { Locale, Localized } from '../schema/resume'

interface BulletListProps {
  items: Localized[]
  locale: Locale
}

/** Lista de marcadores com um texto por item, no idioma da página. */
export const BulletList = ({ items, locale }: BulletListProps) => (
  <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-ink-muted marker:text-ink-subtle">
    {items.map((item) => (
      <li key={item.en} className="text-pretty">
        {pick(item, locale)}
      </li>
    ))}
  </ul>
)
