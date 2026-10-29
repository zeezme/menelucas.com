import type { Translator } from '../internationalization'
import { Tooltip } from './Tooltip'
import { ArrowUpIcon } from './icons'

interface BackToTopProps {
  translate: Translator
}

/**
 * Botão flutuante, bem discreto, para voltar ao topo. Só aparece depois de rolar a página e só com JavaScript
 * (`controls-script.ts` tira o `hidden`). Fica fora da impressão.
 */
export const BackToTop = ({ translate }: BackToTopProps) => (
  <div className="fixed bottom-4 right-4 z-30 print:hidden sm:bottom-6 sm:right-6">
    <Tooltip label={translate('backToTop')} side="top" align="end">
      <button
        type="button"
        hidden
        data-back-to-top
        aria-label={translate('backToTop')}
        className="inline-flex size-11 items-center justify-center rounded-full border border-hairline bg-surface-1 text-ink-subtle opacity-80 transition-opacity hover:bg-surface-2 hover:text-ink hover:opacity-100 focus-visible:opacity-100"
      >
        <ArrowUpIcon />
      </button>
    </Tooltip>
  </div>
)
