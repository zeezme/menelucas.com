import { PageShell } from '../components/PageShell'
import { ProjectDetail } from '../components/projects/ProjectDetail'
import { createTranslator, pagePath, projectPath } from '../internationalization'
import { projectSlug, projectTitle, type InterfaceTexts, type Locale, type Project, type Resume } from '../schema/resume'
import { areasScript } from '../seo/areas-script'

interface ProjectPageProps {
  resume: Resume
  interfaceTexts: InterfaceTexts
  /** Projeto que ocupa a página inteira. */
  project: Project
  locale: Locale
  /** Prefixo de publicação, com barras nas pontas. */
  base: string
}

/**
 * Página própria de um projeto (`/projetos/<projeto>/` e `/en/projects/<projeto>/`): o mesmo conteúdo do projeto na
 * página de Projetos, mas com endereço, título e descrição só dele, e um caminho de volta para a lista.
 */
export const ProjectPage = ({ resume, interfaceTexts, project, locale, base }: ProjectPageProps) => {
  const translate = createTranslator(interfaceTexts, locale)
  const slug = projectSlug(project)
  return (
    <PageShell
      resume={resume}
      currentPage="projects"
      isChildPage
      hrefForLocale={(targetLocale) => projectPath(slug, targetLocale, base)}
      locale={locale}
      base={base}
      translate={translate}
    >
      <main id="content" tabIndex={-1} className="flex flex-col gap-8 outline-none">
        <nav aria-label={translate('breadcrumbNav')} className="print:hidden">
          <ol className="flex flex-wrap items-center gap-x-2 text-sm text-ink-muted">
            <li>
              <a
                href={pagePath('projects', locale, base)}
                className="inline-flex min-h-touch items-center underline decoration-hairline-strong underline-offset-4 hover:text-ink"
              >
                {translate('projects')}
              </a>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" translate="no" className="text-ink">
              {projectTitle(project, locale)}
            </li>
          </ol>
        </nav>
        <ProjectDetail project={project} hasTabs={false} standalone locale={locale} base={base} translate={translate} />
      </main>
      <div role="status" aria-live="polite" className="sr-only" data-areas-status data-opened-label={translate('partOpened')} />
      <script dangerouslySetInnerHTML={{ __html: areasScript }} />
    </PageShell>
  )
}
