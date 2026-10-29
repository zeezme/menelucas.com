import { PageShell } from '../components/PageShell'
import { ProjectMenu } from '../components/projects/ProjectMenu'
import { createTranslator, pagePath } from '../internationalization'
import { showcaseProjects, type InterfaceTexts, type Locale, type Resume } from '../schema/resume'
import { legacyHashScript } from '../seo/legacy-hash-script'

interface ProjectsPageProps {
  resume: Resume
  interfaceTexts: InterfaceTexts
  locale: Locale
  /** Prefixo de publicação, com barras nas pontas. */
  base: string
}

/** Página de projetos (`/projetos/` e `/en/projects/`): o menu que leva à página própria de cada projeto. */
export const ProjectsPage = ({ resume, interfaceTexts, locale, base }: ProjectsPageProps) => {
  const translate = createTranslator(interfaceTexts, locale)
  return (
    <PageShell
      resume={resume}
      currentPage="projects"
      hrefForLocale={(targetLocale) => pagePath('projects', targetLocale, base)}
      locale={locale}
      base={base}
      translate={translate}
    >
      <main id="content" tabIndex={-1} className="flex flex-col gap-8 outline-none">
        <h1 className="text-balance text-[1.75rem] font-semibold leading-[1.1] tracking-display sm:text-[2.25rem]">
          {translate('projects')}
        </h1>
        <ProjectMenu projects={showcaseProjects(resume)} locale={locale} base={base} translate={translate} />
      </main>
      <script dangerouslySetInnerHTML={{ __html: legacyHashScript }} />
    </PageShell>
  )
}
