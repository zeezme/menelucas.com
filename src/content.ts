import resumeJson from '../content/resume.json'
import interfaceTextsJson from '../content/ui.json'
import { parseInterfaceTexts, parseResume } from './schema/resume'

/** Currículo validado. Qualquer erro em `resume.json` derruba o build. */
export const resume = parseResume(resumeJson)

/** Textos de interface validados. Qualquer erro em `ui.json` derruba o build. */
export const interfaceTexts = parseInterfaceTexts(interfaceTextsJson)
