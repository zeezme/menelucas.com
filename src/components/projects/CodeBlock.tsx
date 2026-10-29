import { pick } from '../../internationalization'
import type { Locale, Snippet } from '../../schema/resume'

interface CodeBlockProps {
  snippet: Snippet
  locale: Locale
}

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- o bloco rola na horizontal e precisa de foco por teclado (axe: scrollable-region-focusable) */

/** Trecho de código com legenda; rola na horizontal e recebe foco por teclado. */
export const CodeBlock = ({ snippet, locale }: CodeBlockProps) => (
  <figure className="flex flex-col gap-3">
    <pre
      tabIndex={0}
      className="overflow-x-auto rounded-xl border border-hairline bg-surface-1 p-4 text-[0.8125rem] leading-relaxed text-ink-muted"
    >
      <code data-language={snippet.language}>{snippet.code}</code>
    </pre>
    <figcaption className="text-pretty text-sm leading-relaxed text-ink-muted">{pick(snippet.caption, locale)}</figcaption>
  </figure>
)

/* eslint-enable jsx-a11y/no-noninteractive-tabindex */
