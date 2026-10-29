import { z } from 'zod'

export const LOCALES = ['pt', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** Texto visível em todos os idiomas. Faltar um idioma falha o build. */
const localized = z.strictObject({
  pt: z.string().min(1),
  en: z.string().min(1),
})
export type Localized = z.infer<typeof localized>

const localizedList = z.strictObject({
  pt: z.array(z.string().min(1)).min(1),
  en: z.array(z.string().min(1)).min(1),
})

/** Mês/ano ISO, como `2026-02`. */
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'use o formato AAAA-MM')

const profile = z.strictObject({
  network: z.string().min(1),
  url: z.url(),
})

const highlight = localized

const workSection = z.strictObject({
  title: localized,
  highlights: z.array(highlight).min(1),
})

const work = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    position: localized,
    startDate: yearMonth,
    endDate: yearMonth.optional(),
    location: localized,
    summary: localized.optional(),
    /** Tecnologias da experiência (linha "Stack" do card). */
    keywords: z.array(z.string().min(1)).min(1).optional(),
    sections: z.array(workSection).optional(),
    highlights: z.array(highlight).optional(),
  })
  .refine((workItem) => (workItem.sections?.length ?? 0) + (workItem.highlights?.length ?? 0) > 0, {
    message: 'informe highlights ou sections',
  })
  .refine((workItem) => workItem.endDate === undefined || workItem.endDate >= workItem.startDate, {
    message: 'endDate anterior a startDate',
  })

/** Captura de tela da página de projeto; `src` é relativo à raiz do site (arquivo em public/). */
const galleryItem = z.strictObject({
  src: z.string().regex(/^[\w/.-]+\.(webp|png|jpe?g)$/, 'caminho relativo de imagem'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Largura máxima de exibição em px (para capturas estreitas). */
  maxWidth: z.number().int().positive().optional(),
  alt: localized,
  caption: localized,
})

/** Uma parte do sistema na página do projeto: resumo, tópicos e capturas de tela. */
const snippet = z.strictObject({
  caption: localized,
  language: z.string().min(1),
  code: z.string().min(1),
})

/** Diagrama de fluxo: etapas empilhadas, cada uma com um ou mais blocos lado a lado (HTML, não imagem). */
const flowNode = z.strictObject({
  title: localized,
  detail: localized.optional(),
  /** accent = ponto central; future = caminho futuro (tracejado). */
  tone: z.enum(['accent', 'future']).optional(),
})
const flowStage = z.strictObject({
  /** Rótulo da caixa que agrupa os blocos da etapa. */
  title: localized.optional(),
  /** Texto na seta que liga a etapa anterior a esta. */
  connector: localized.optional(),
  nodes: z.array(flowNode).min(1).max(4),
})
const diagram = z.strictObject({
  title: localized,
  caption: localized,
  stages: z.array(flowStage).min(2),
})

const area = z.strictObject({
  title: localized,
  summary: localized.optional(),
  points: z.array(highlight).optional(),
  /** Blocos com título curto e texto, para explicar a parte em tópicos em vez de marcadores. */
  topics: z.array(z.strictObject({ title: localized, text: localized })).min(1).optional(),
  diagrams: z.array(diagram).optional(),
  snippets: z.array(snippet).optional(),
  gallery: z.array(galleryItem).min(1).optional(),
})

/** Projeto pessoal/atual (JSON Resume `projects`). Sem `endDate` = em andamento. */
const project = z
  .strictObject({
    name: z.string().min(1),
    /** Prefixo dos endereços (#slug-...) das partes; padrão: o nome em minúsculas, sem acentos. */
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    /** Título exibido nos dois idiomas; sem ele, mostra `name` (nome próprio, sem tradução). */
    title: localized.optional(),
    roles: localized,
    startDate: yearMonth,
    endDate: yearMonth.optional(),
    description: localized,
    /** Texto do card no currículo (substitui a descrição e os destaques, que ficam só na página do projeto). */
    cardText: localized.optional(),
    /** Aviso fixo no topo do projeto (ex.: confidencialidade). */
    banner: localized.optional(),
    /** Diagramas da visão geral. */
    diagrams: z.array(diagram).optional(),
    highlights: z.array(highlight).min(1),
    /** Seções temáticas, só na página do projeto (o card do currículo mostra apenas `highlights`). */
    detailSections: z.array(z.strictObject({ title: localized, items: z.array(highlight).min(1) })).optional(),
    /** Nota em destaque na página do projeto (ex.: o alcance do que foi descrito). */
    notice: localized.optional(),
    /** Partes do sistema (barra lateral da página do projeto), cada uma com explicação e telas. */
    areas: z.array(area).min(1).optional(),
    /** Aviso exibido junto às telas (ex.: dados fictícios). */
    galleryNote: localized.optional(),
    url: z.url().optional(),
  })
  .refine((project) => project.endDate === undefined || project.endDate >= project.startDate, {
    message: 'endDate anterior a startDate',
  })

export const resumeSchema = z.strictObject({
  meta: z.strictObject({
    locales: z.tuple([z.literal('pt'), z.literal('en')]),
    defaultLocale: z.enum(LOCALES),
    pdf: z.strictObject({ pt: z.string().startsWith('/'), en: z.string().startsWith('/') }),
  }),
  basics: z.strictObject({
    name: z.string().min(1),
    /** Variações do nome usadas em buscas (ex.: sem os sobrenomes do meio). */
    alternateNames: z.array(z.string().min(1)).optional(),
    label: localized,
    email: z.email(),
    phone: z.string().optional(),
    location: z.strictObject({
      city: z.string(),
      region: z.string(),
      countryCode: z.string().length(2),
      note: localized,
    }),
    summary: localized,
    profiles: z.array(profile).min(1),
  }),
  skills: z.array(z.strictObject({ name: localized, keywords: localizedList })).min(1),
  work: z.array(work).min(1),
  /** Seção opcional: sem `projects` (ou vazio) a seção não aparece. */
  projects: z.array(project).optional(),
  education: z
    .array(
      z.strictObject({
        institution: localized,
        area: localized,
        status: localized,
      }),
    )
    .min(1),
  languages: z
    .array(z.strictObject({ code: z.string().regex(/^[a-z]{2}$/), language: localized, fluency: localized }))
    .min(1),
})

export type Resume = z.infer<typeof resumeSchema>
export type Work = Resume['work'][number]
export type Project = NonNullable<Resume['projects']>[number]
export type Area = NonNullable<Project['areas']>[number]
export type GalleryItem = NonNullable<Area['gallery']>[number]
export type Diagram = NonNullable<Area['diagrams']>[number]
export type Snippet = NonNullable<Area['snippets']>[number]

/** A aba/página Projetos só existe se algum projeto tiver partes do sistema (tirar o item do JSON remove tudo). */
export const showcaseProjects = (resume: Resume): Project[] =>
  (resume.projects ?? []).filter((project) => (project.areas?.length ?? 0) > 0)

/** Transforma um texto em slug de URL: minúsculas, sem acentos, com hífens entre as palavras. */
export const toSlug = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Prefixo dos endereços (`#slug-parte`) de um projeto. */
export const projectSlug = (project: Project): string => project.slug ?? toSlug(project.name)

/** Título do projeto no idioma pedido; sem `title`, o nome próprio. */
export const projectTitle = (project: Project, locale: Locale): string => project.title?.[locale] ?? project.name

/** Valida o conteúdo de `resume.json`; qualquer erro derruba o build com a lista dos campos inválidos. */
export const parseResume = (data: unknown): Resume => {
  const result = resumeSchema.safeParse(data)
  if (!result.success) {
    throw new Error(`resume.json inválido:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

const interfaceTextsSchema = z.record(
  z.string(),
  z.strictObject({ pt: z.string().min(1), en: z.string().min(1) }),
)
/** Textos de interface (`content/ui.json`), por chave e idioma. */
export type InterfaceTexts = z.infer<typeof interfaceTextsSchema>

/** Valida `content/ui.json`. */
export const parseInterfaceTexts = (data: unknown): InterfaceTexts => interfaceTextsSchema.parse(data)
