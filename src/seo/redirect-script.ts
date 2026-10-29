/**
 * Script inline, sem dependências, executado antes da primeira pintura:
 * - grava no `localStorage` o idioma escolhido no botão PT | EN;
 * - na página em português (atributo `data-en-url` no `<html>`), redireciona para a versão em inglês quando a
 *   preferência salva ou o idioma do navegador for inglês, preservando o `#` da URL. A decisão acontece uma vez,
 *   porque a escolha fica salva.
 *
 * A detecção segue `detectLocale`, em `src/internationalization`: `pt*` vira português e o resto, inglês.
 * O acesso ao `localStorage` fica em `try/catch` para funcionar com o armazenamento bloqueado.
 */
export const redirectScript = `(() => {
  const root = document.documentElement;
  document.addEventListener('click', (event) => {
    const languageLink = event.target?.closest?.('[data-lang]');
    if (!languageLink) return;
    try { localStorage.setItem('lang', languageLink.getAttribute('data-lang')); } catch (error) {}
  });
  const englishUrl = root.getAttribute('data-en-url');
  if (!englishUrl) return;
  let savedLanguage = null;
  try { savedLanguage = localStorage.getItem('lang'); } catch (error) {}
  let targetLanguage = savedLanguage;
  if (targetLanguage !== 'pt' && targetLanguage !== 'en') {
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
    targetLanguage = /^pt/i.test(languages[0] || '') ? 'pt' : 'en';
    try { localStorage.setItem('lang', targetLanguage); } catch (error) {}
  }
  if (targetLanguage === 'en') location.replace(englishUrl + location.hash);
})();`
