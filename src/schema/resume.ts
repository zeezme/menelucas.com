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
    sections: z.array(workSection).optional(),
    highlights: z.array(highlight).optional(),
  })
  .refine((w) => (w.sections?.length ?? 0) + (w.highlights?.length ?? 0) > 0, {
    message: 'informe highlights ou sections',
  })
  .refine((w) => w.endDate === undefined || w.endDate >= w.startDate, {
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

export function parseResume(data: unknown): Resume {
  const result = resumeSchema.safeParse(data)
  if (!result.success) {
    throw new Error(`resume.json inválido:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

const uiSchema = z.record(
  z.string(),
  z.strictObject({ pt: z.string().min(1), en: z.string().min(1) }),
)
export type UiStrings = z.infer<typeof uiSchema>

export function parseUi(data: unknown): UiStrings {
  return uiSchema.parse(data)
}
