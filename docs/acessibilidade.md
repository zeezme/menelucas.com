# Acessibilidade

O site segue a WCAG 2.2 nível AA. Cada item abaixo diz o que foi feito e qual teste o protege.

## Como a cobertura funciona

- `tests/e2e/a11y-axe.spec.ts` roda o axe com todas as regras WCAG 2.0, 2.1 e 2.2 (A e AA) e as boas práticas, no currículo e em **todas as partes de todos os projetos**, em PT e EN, nos temas claro e escuro.
- `tests/e2e/a11y-keyboard.spec.ts`, `a11y-semantics.spec.ts` e `a11y-preferences.spec.ts` cobrem o que o axe não vê: foco, teclado, nomes, ordem dos títulos e preferências do usuário.
- O CI (`verify`) roda tudo em cada PR. Uma regressão de acessibilidade barra o merge.

## O que está implementado

| Tema | O que foi feito | Onde |
| --- | --- | --- |
| Teclado | Todo controle recebe foco por Tab, com indicador visível; link de pular para o conteúdo; nenhum contêiner corta o contorno do foco | `a11y-keyboard.spec.ts` |
| Foco ao trocar de parte | Anterior e Próxima levam o foco ao título da parte aberta; nas abas e na barra lateral o foco volta ao link | `src/seo/areas-script.ts` |
| Anúncios | Uma região `role="status"` anuncia a parte aberta | `src/pages/ProjectsPage.tsx` |
| Estado do tema | O botão usa `aria-pressed` | `src/components/ThemeToggle.tsx` |
| Dicas | Aparecem no mouse e no foco, o ponteiro pode ir até elas e Esc as dispensa (WCAG 1.4.13); ficam `aria-hidden` para não repetir o nome | `src/components/Tooltip.tsx` |
| Voltar ao topo | Botão discreto, só com JavaScript e depois de rolar; respeita `prefers-reduced-motion` | `src/components/BackToTop.tsx` |
| Nomes | Links com o mesmo nome levam ao mesmo destino; o link de detalhes diz de qual projeto é; o PDF diz o tipo do arquivo; o link de nova aba avisa | `a11y-semantics.spec.ts` |
| Estrutura | Um único `h1`, títulos sem pular nível, regiões com nomes únicos | `a11y-semantics.spec.ts` |
| Não depender de cor | Blocos planejados dos diagramas têm texto, além do tracejado | `src/components/projects/FlowDiagram.tsx` |
| Zoom e texto | Reflow em 320 px (400% de zoom); espaçamento de texto da WCAG 1.4.12 | `a11y-preferences.spec.ts` |
| Alvos | Pelo menos 24 × 24 px (WCAG 2.5.8) | `a11y-preferences.spec.ts` |
| Movimento | `prefers-reduced-motion` desliga rolagem suave e transições; a troca de tema não pisca | `src/styles/main.css` |
| Contraste | `prefers-contrast: more` e `forced-colors: active` | `src/styles/main.css` |
| Sem JavaScript | Todas as partes ficam visíveis em sequência; o que depende de JS fica escondido | `tests/e2e/projects.spec.ts` |

## Ao mexer no site

1. Rode `npm run test:e2e`. Os testes de acessibilidade falham com a lista dos elementos com problema.
2. Controle novo só com ícone: use `Tooltip` e um `aria-label` (ou texto `sr-only`).
3. Link para outro site em nova aba: `target="_blank"`, `rel="noopener noreferrer"` e o texto `sr-only` "abre em nova aba".
4. Estado que só muda de cor precisa de uma segunda marca (texto, contorno ou ícone).
5. Não use `overflow: hidden` em um contêiner que tenha controles com foco: ele corta o contorno.
