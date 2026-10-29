import { ProfileHeader } from '../components/ProfileHeader'
import { SkipLink } from '../components/SkipLink'
import { TabNavigation } from '../components/TabNavigation'
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
    <>
      <SkipLink translate={translate} />
      <div className="mx-auto flex w-full max-w-prose flex-col gap-10 px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:pt-16">
        <TabNavigation resume={resume} currentPage="resume" locale={locale} base={base} translate={translate} />
        <ProfileHeader resume={resume} locale={locale} base={base} translate={translate} />
        <main id="content" tabIndex={-1} className="flex flex-col gap-10 outline-none">
          <SummarySection resume={resume} locale={locale} translate={translate} />
          <SkillsSection resume={resume} locale={locale} translate={translate} />
          <ExperienceSection resume={resume} locale={locale} translate={translate} />
          <ProjectsSection resume={resume} locale={locale} base={base} translate={translate} />
          <EducationSection resume={resume} locale={locale} translate={translate} />
          <LanguagesSection resume={resume} locale={locale} translate={translate} />
        </main>
      </div>
    </>
  )
}
