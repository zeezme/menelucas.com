import { PageShell } from '../components/PageShell'
import { ArrowLeftIcon } from '../components/icons'
import { ProjectDetail } from '../components/projects/ProjectDetail'
import { createTranslator, pagePath, projectPath } from '../internationalization'
import { projectSlug, type InterfaceTexts, type Locale, type Project, type Resume } from '../schema/resume'
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
 * Página própria de um projeto (`/projetos/<projeto>/` e `/en/projects/<projeto>/`): endereço, título e descrição só
 * dele, a barra lateral com as partes do sistema e um botão para voltar ao menu de projetos.
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
      <main id="content" tabIndex={-1} className="flex flex-col gap-6 outline-none">
        <a
          href={pagePath('projects', locale, base)}
          className="-ml-2 inline-flex min-h-touch items-center gap-2 self-start rounded-btn px-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink print:hidden"
        >
          <ArrowLeftIcon />
          {translate('backToProjects')}
        </a>
        <ProjectDetail project={project} locale={locale} base={base} translate={translate} />
      </main>
      <div role="status" aria-live="polite" className="sr-only" data-areas-status data-opened-label={translate('partOpened')} />
      <script dangerouslySetInnerHTML={{ __html: areasScript }} />
    </PageShell>
  )
}
