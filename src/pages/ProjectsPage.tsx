import { PageShell } from '../components/PageShell'
import { ProjectDetail } from '../components/projects/ProjectDetail'
import { ProjectTabs } from '../components/projects/ProjectTabs'
import { createTranslator, localePath } from '../internationalization'
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
    <PageShell resume={resume} currentPage="projects" locale={locale} base={base} translate={translate}>
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
      <script dangerouslySetInnerHTML={{ __html: areasScript }} />
    </PageShell>
  )
}
