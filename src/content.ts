import resumeJson from '../content/resume.json'
import uiJson from '../content/ui.json'
import { parseResume, parseUi } from './schema/resume'

/** Valida os dados na carga: qualquer erro em resume.json/ui.json derruba o build. */
export const resume = parseResume(resumeJson)
export const ui = parseUi(uiJson)
