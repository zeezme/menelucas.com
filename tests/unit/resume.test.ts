import { describe, expect, it } from 'vitest'
import resumeJson from '../../content/resume.json'
import uiJson from '../../content/ui.json'
import { parseResume, parseInterfaceTexts } from '../../src/schema/resume'

const resume = parseResume(resumeJson)

describe('resume.json', () => {
  it('valida contra o schema', () => {
    expect(() => parseResume(resumeJson)).not.toThrow()
    expect(() => parseInterfaceTexts(uiJson)).not.toThrow()
  })

  it('rejeita idioma faltando', () => {
    const broken = structuredClone(resumeJson) as { basics: { summary: Record<string, string> } }
    delete broken.basics.summary['en']
    expect(() => parseResume(broken)).toThrow(/summary/)
  })

  it('rejeita campos desconhecidos e datas inválidas', () => {
    const extra = { ...structuredClone(resumeJson), cpf: '000' }
    expect(() => parseResume(extra)).toThrow()
    const badDate = structuredClone(resumeJson) as { work: { startDate: string }[] }
    badDate.work = badDate.work.map((w) => ({ ...w, startDate: '2026-13' }))
    expect(() => parseResume(badDate)).toThrow()
  })

  it('tem a mesma estrutura em PT e EN (mesmas quantidades)', () => {
    for (const group of resume.skills) {
      expect(group.keywords.pt.length, group.name.en).toBe(group.keywords.en.length)
    }
  })

  it('lista experiências em ordem cronológica decrescente', () => {
    const starts = resume.work.map((w) => w.startDate)
    expect(starts).toEqual([...starts].sort().reverse())
  })
})

describe('projects (seção opcional)', () => {
  const clone = () => structuredClone(resumeJson) as unknown as Record<string, unknown> & { projects?: Record<string, unknown>[] }

  it('o schema aceita com e sem projects', () => {
    const without = clone()
    delete without.projects
    expect(parseResume(without).projects).toBeUndefined()
    expect(parseResume({ ...without, projects: [] }).projects).toEqual([])
    expect(parseResume(resumeJson).projects).toHaveLength(resumeJson.projects.length)
  })

  it('rejeita projeto com idioma faltando, data inválida ou fim antes do início', () => {
    const noEn = clone()
    delete (noEn.projects?.[0]?.['description'] as Record<string, string>)['en']
    expect(() => parseResume(noEn)).toThrow(/description/)

    const badDate = clone()
    if (badDate.projects?.[0]) badDate.projects[0]['startDate'] = '2026-13'
    expect(() => parseResume(badDate)).toThrow()

    const reversed = clone()
    if (reversed.projects?.[0]) reversed.projects[0]['endDate'] = '2026-01'
    expect(() => parseResume(reversed)).toThrow(/endDate/)

    const noHighlights = clone()
    if (noHighlights.projects?.[0]) noHighlights.projects[0]['highlights'] = []
    expect(() => parseResume(noHighlights)).toThrow()
  })
})

describe('partes do sistema e galeria do projeto', () => {
  type Raw = { projects: { areas: { gallery?: Record<string, unknown>[] }[] }[] }
  const clone = () => structuredClone(resumeJson) as unknown as Raw

  it('as capturas têm dimensões e alt nos dois idiomas', () => {
    const areas = resume.projects?.[0]?.areas ?? []
    const items = areas.flatMap((a) => a.gallery ?? [])
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.width).toBeGreaterThan(0)
      expect(item.height).toBeGreaterThan(0)
      expect(item.alt.pt.length).toBeGreaterThan(10)
      expect(item.alt.en.length).toBeGreaterThan(10)
    }
  })

  it('rejeita galeria com caminho absoluto, sem alt ou vazia', () => {
    const abs = clone()
    const first = abs.projects[0]?.areas[0]?.gallery?.[0]
    if (first) first['src'] = 'https://exemplo.com/x.webp'
    expect(() => parseResume(abs)).toThrow()

    const noAlt = clone()
    const alt = noAlt.projects[0]?.areas[0]?.gallery?.[0]?.['alt'] as Record<string, string> | undefined
    if (alt) delete alt['en']
    expect(() => parseResume(noAlt)).toThrow()

    const empty = clone()
    const area = empty.projects[0]?.areas[0]
    if (area) area.gallery = []
    expect(() => parseResume(empty)).toThrow()
  })

  it('rejeita diagrama com etapa sem blocos ou bloco sem idioma', () => {
    type Raw = { projects: { areas: { diagrams?: { stages: { nodes: Record<string, unknown>[] }[] }[] }[] }[] }
    const noNodes = structuredClone(resumeJson) as unknown as Raw
    const first = noNodes.projects[0]?.areas.find((a) => a.diagrams)?.diagrams?.[0]
    if (first?.stages[0]) first.stages[0].nodes = []
    expect(() => parseResume(noNodes)).toThrow()

    const noEn = structuredClone(resumeJson) as unknown as Raw
    const node = noEn.projects[0]?.areas.find((a) => a.diagrams)?.diagrams?.[0]?.stages[0]?.nodes[0]
    if (node) delete (node['title'] as Record<string, string>)['en']
    expect(() => parseResume(noEn)).toThrow()
  })
})
