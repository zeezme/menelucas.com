import { LanguageToggle } from '../components/LanguageToggle'
import { SkipLink } from '../components/SkipLink'
import { TabNavigation } from '../components/TabNavigation'
import { ThemeToggle } from '../components/ThemeToggle'
import { ProjectDetail } from '../components/projects/ProjectDetail'
import { ProjectTabs } from '../components/projects/ProjectTabs'
import { createTranslator, localePath, pagePath } from '../internationalization'
import { projectSlug, showcaseProjects, type InterfaceTexts, type Locale, type Resume } from '../schema/resume'
import { areasScript } from '../seo/areas-script'

interface ProjectsPageProps {
  resume: Resume
  interfaceTexts: InterfaceTexts
  locale: Locale
  /** Prefixo de publicação, com barras nas pontas. */
  base: string
}

/** Página de projetos (`/projetos/` e `/en/projects/`): abas de projeto e, em cada um, a barra lateral com as partes do sistema. */
export const ProjectsPage = ({ resume, interfaceTexts, locale, base }: ProjectsPageProps) => {
  const translate = createTranslator(interfaceTexts, locale)
  const projects = showcaseProjects(resume)
  const hasTabs = projects.length > 1
  return (
    <>
      <SkipLink translate={translate} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:pt-16">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4 print:hidden">
          <TabNavigation resume={resume} currentPage="projects" locale={locale} base={base} translate={translate} />
          <div className="flex items-center gap-3">
            <LanguageToggle
              locale={locale}
              hrefForLocale={(targetLocale) => pagePath('projects', targetLocale, base)}
              translate={translate}
            />
            <ThemeToggle translate={translate} />
          </div>
        </header>
        <main id="content" tabIndex={-1} className="flex flex-col gap-10 outline-none">
          <div>
            <h1 className="text-balance text-[1.75rem] font-semibold leading-[1.1] tracking-display sm:text-[2.25rem]">
              {translate('projects')}
            </h1>
            <p className="mt-2 text-sm text-ink-subtle">
              <a href={localePath(locale, base)} className="underline decoration-hairline-strong underline-offset-4 hover:text-ink">
                {resume.basics.name}
              </a>
            </p>
          </div>
          {hasTabs ? <ProjectTabs projects={projects} locale={locale} translate={translate} /> : null}
          {projects.map((project) => (
            <ProjectDetail
              key={projectSlug(project)}
              project={project}
              hasTabs={hasTabs}
              locale={locale}
              base={base}
              translate={translate}
            />
          ))}
        </main>
      </div>
      <script dangerouslySetInnerHTML={{ __html: areasScript }} />
    </>
  )
}
