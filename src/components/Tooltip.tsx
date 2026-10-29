import type { ReactNode } from 'react'

interface TooltipProps {
  /** Texto da dica. */
  label: string
  /** Onde a dica aparece em relação ao controle. */
  side?: 'bottom' | 'top'
  /** Alinhamento horizontal da dica. */
  align?: 'center' | 'start' | 'end'
  /** Esconde a dica em telas pequenas, onde o controle já mostra o próprio texto. */
  desktopOnly?: boolean
  /** Classes do contêiner, para ele acompanhar a largura do controle (ex.: botão que ocupa a coluna inteira). */
  className?: string
  children: ReactNode
}

/**
 * Dica visual para controles que só têm ícone. O controle já tem nome acessível, então a dica fica `aria-hidden`
 * (não repete o nome para leitores de tela). Segue a WCAG 1.4.13: aparece no foco do teclado e no mouse, o ponteiro
 * pode passar para a dica sem ela sumir e a tecla Esc a dispensa (ver `controls-script.ts`).
 */
export const Tooltip = ({ label, side = 'bottom', align = 'center', desktopOnly = false, className = '', children }: TooltipProps) => (
  <span className={`tooltip-host ${className}`} data-desktop-only={desktopOnly ? '' : undefined}>
    {children}
    <span aria-hidden="true" className="tooltip" data-side={side} data-align={align}>
      {label}
    </span>
  </span>
)
