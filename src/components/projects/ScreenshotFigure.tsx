import { pick } from '../../internationalization'
import type { GalleryItem, Locale } from '../../schema/resume'

interface ScreenshotFigureProps {
  item: GalleryItem
  locale: Locale
  base: string
}

/** Captura de tela com legenda; carrega sob demanda e reserva o espaço pelas dimensões. */
export const ScreenshotFigure = ({ item, locale, base }: ScreenshotFigureProps) => (
  <figure className="flex flex-col gap-3" style={item.maxWidth ? { maxWidth: `${item.maxWidth}px` } : undefined}>
    <img
      src={`${base}${item.src}`}
      alt={pick(item.alt, locale)}
      width={item.width}
      height={item.height}
      loading="lazy"
      decoding="async"
      className="h-auto w-full rounded-xl border border-hairline bg-surface-1"
    />
    <figcaption className="text-pretty text-sm leading-relaxed text-ink-muted">{pick(item.caption, locale)}</figcaption>
  </figure>
)
