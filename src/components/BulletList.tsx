import { pick } from '../internationalization'
import type { Locale, Localized } from '../schema/resume'

interface BulletListProps {
  items: Localized[]
  locale: Locale
  /** Classes extras, como um limite de largura de linha. */
  className?: string
}

/** Lista de marcadores com um texto por item, no idioma da página. */
export const BulletList = ({ items, locale, className = '' }: BulletListProps) => (
  <ul className={`flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-ink-muted marker:text-ink-subtle ${className}`}>
    {items.map((item) => (
      <li key={item.en} className="text-pretty">
        {pick(item, locale)}
      </li>
    ))}
  </ul>
)
