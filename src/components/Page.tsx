import type { Locale, Resume, UiStrings } from '../schema/resume'
import { createT } from '../i18n'
import { Header } from './Header'
import { Education, Experience, Languages, Projects, Skills, Summary } from './Sections'

interface Props {
  resume: Resume
  ui: UiStrings
  locale: Locale
  base: string
}

export function Page({ resume, ui, locale, base }: Props) {
  const t = createT(ui, locale)
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-btn focus:bg-accent-solid focus:px-4 focus:py-3 focus:text-white"
      >
        {t('skipLink')}
      </a>
      <div className="mx-auto flex w-full max-w-prose flex-col gap-10 px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:pt-16">
        <Header resume={resume} locale={locale} base={base} t={t} />
        <main id="content" tabIndex={-1} className="flex flex-col gap-10 outline-none">
          <Summary resume={resume} locale={locale} t={t} />
          <Skills resume={resume} locale={locale} t={t} />
          <Experience resume={resume} locale={locale} t={t} />
          <Projects resume={resume} locale={locale} t={t} />
          <Education resume={resume} locale={locale} t={t} />
          <Languages resume={resume} locale={locale} t={t} />
        </main>
      </div>
    </>
  )
}
