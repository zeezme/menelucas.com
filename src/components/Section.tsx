import type { ReactNode } from 'react'

interface SectionProps {
  /** Prefixo dos ids; o título recebe `<id>-title`. */
  id: string
  title: string
  children: ReactNode
}

/** Seção do currículo, com título pequeno em caixa alta e um filete no topo. */
export const Section = ({ id, title, children }: SectionProps) => (
  <section aria-labelledby={`${id}-title`} className="border-t border-hairline pt-8">
    <h2 id={`${id}-title`} className="mb-5 text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">
      {title}
    </h2>
    {children}
  </section>
)
