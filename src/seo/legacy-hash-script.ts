/**
 * Script inline da lista de projetos. Os endereços antigos, como `/projetos/#clinica-overview`, abriam uma parte
 * de um projeto dentro da lista; agora cada projeto tem a própria página. Se o `#` começa com o nome de um projeto
 * (`<projeto>-...`), a pessoa é levada à página dele, mantendo o `#`, para que links antigos continuem funcionando.
 */
export const legacyHashScript = `(() => {
  const hash = location.hash.slice(1);
  if (!hash) return;
  const link = [...document.querySelectorAll('[data-project-slug]')].find((candidate) =>
    hash.startsWith(candidate.getAttribute('data-project-slug') + '-'),
  );
  if (link) location.replace(link.getAttribute('href') + location.hash);
})();`
