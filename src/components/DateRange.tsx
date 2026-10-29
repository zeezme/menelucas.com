import { formatYearMonth } from '../internationalization'
import type { Locale } from '../schema/resume'

interface DateRangeProps {
  startDate: string
  endDate?: string | undefined
  locale: Locale
  /** Texto exibido quando não há data final (ex.: "atual"). */
  presentLabel?: string
}

/** Período no formato `02/2026 – 09/2026`, com `<time>` em cada data. */
export const DateRange = ({ startDate, endDate, locale, presentLabel }: DateRangeProps) => (
  <>
    <time dateTime={startDate}>{formatYearMonth(startDate, locale)}</time>
    {' – '}
    {endDate ? <time dateTime={endDate}>{formatYearMonth(endDate, locale)}</time> : presentLabel}
  </>
)
