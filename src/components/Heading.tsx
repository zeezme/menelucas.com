import { createElement, type ComponentPropsWithoutRef } from 'react'

/** Nível de título HTML. */
export type HeadingLevel = 1 | 2 | 3 | 4

interface HeadingProps extends ComponentPropsWithoutRef<'h2'> {
  level: HeadingLevel
}

/** Título com o nível escolhido: a mesma parte do site é h2 num contexto e h3 em outro, sem pular níveis. */
export const Heading = ({ level, children, ...props }: HeadingProps) => createElement(`h${level}`, props, children)
