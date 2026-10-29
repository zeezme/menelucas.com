import type { Translator } from '../internationalization'

interface SkipLinkProps {
  /** Tradutor dos textos de interface. */
  translate: Translator
}

/** Primeiro foco da página: leva direto ao conteúdo principal e só fica visível quando focado. */
export const SkipLink = ({ translate }: SkipLinkProps) => (
  <a
    href="#content"
    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-btn focus:bg-accent-solid focus:px-4 focus:py-3 focus:text-white"
  >
    {translate('skipLink')}
  </a>
)
