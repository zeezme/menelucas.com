import { ProfileHeader } from '../components/ProfileHeader'
import { PageShell } from '../components/PageShell'
import { EducationSection } from '../components/resume/EducationSection'
import { ExperienceSection } from '../components/resume/ExperienceSection'
import { LanguagesSection } from '../components/resume/LanguagesSection'
import { ProjectsSection } from '../components/resume/ProjectsSection'
import { SkillsSection } from '../components/resume/SkillsSection'
import { SummarySection } from '../components/resume/SummarySection'
import { createTranslator } from '../internationalization'
import type { InterfaceTexts, Locale, Resume } from '../schema/resume'

interface ResumePageProps {
  resume: Resume
  interfaceTexts: InterfaceTexts
  locale: Locale
  /** Prefixo de publicação, com barras nas pontas. */
  base: string
}

/** Página do currículo (`/` e `/en/`). */
export const ResumePage = ({ resume, interfaceTexts, locale, base }: ResumePageProps) => {
  const translate = createTranslator(interfaceTexts, locale)
  return (
    <PageShell resume={resume} currentPage="resume" locale={locale} base={base} translate={translate}>
      <main id="content" tabIndex={-1} className="flex flex-col gap-10 outline-none">
        <ProfileHeader resume={resume} locale={locale} base={base} translate={translate} />
        <div className="flex max-w-3xl flex-col gap-10">
          <SummarySection resume={resume} locale={locale} translate={translate} />
          <SkillsSection resume={resume} locale={locale} translate={translate} />
          <ExperienceSection resume={resume} locale={locale} translate={translate} />
          <ProjectsSection resume={resume} locale={locale} base={base} translate={translate} />
          <EducationSection resume={resume} locale={locale} translate={translate} />
          <LanguagesSection resume={resume} locale={locale} translate={translate} />
        </div>
      </main>
    </PageShell>
  )
}
