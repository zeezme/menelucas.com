/**
 * Script inline da página de projetos. Melhoria progressiva: sem JavaScript, todos os projetos e todas as partes
 * ficam visíveis em sequência.
 *
 * - Cada projeto tem a sua barra lateral e a sua parte aberta; o `#id` da URL escolhe a parte (e o projeto).
 *   Voltar e avançar funcionam pelo evento `hashchange`.
 * - Com mais de um projeto, o menu de abas mostra um por vez e lembra a parte aberta de cada um.
 * - No fim de cada parte, os botões Anterior e Próxima ajudam no celular, onde a barra lateral fica no topo.
 * - A parte aberta recebe `aria-current` no link; as demais ganham o atributo `hidden`.
 * - Os links de idioma levam o `#` da parte aberta para a outra versão da página.
 * - Acessibilidade: ao trocar de parte pelo teclado ou pelos botões Anterior e Próxima, o foco vai para o título da
 *   parte aberta (o botão que recebeu o clique muda de destino); nos links da barra lateral e das abas o foco volta
 *   ao link (a navegação por `#` o tiraria dele), e uma região `role="status"` anuncia a troca.
 */
export const areasScript = `(() => {
  const navigations = [...document.querySelectorAll('[data-areas-nav]')];
  if (!navigations.length) return;
  const projectLinks = [...document.querySelectorAll('[data-project-link]')];
  const projects = navigations.map((navigation) => {
    const article = navigation.closest('article');
    const links = [...navigation.querySelectorAll('a[href^="#"]')];
    return {
      article,
      links,
      panels: links.map((link) => document.getElementById(link.getAttribute('href').slice(1))),
      pager: article.querySelector('[data-areas-pager]'),
    };
  });
  let activeProject = 0;
  let moveFocus = false;
  let activatedLink = null;
  const status = document.querySelector('[data-areas-status]');

  const currentHash = () => {
    try { return decodeURIComponent(location.hash.slice(1)); } catch (error) { return ''; }
  };
  const openLink = (project) => project.links.find((link) => link.getAttribute('aria-current')) || project.links[0];

  const updatePager = (project, index) => {
    if (!project.pager) return;
    project.pager.hidden = false;
    for (const direction of ['prev', 'next']) {
      const button = project.pager.querySelector('[data-pager="' + direction + '"]');
      const destination = project.links[index + (direction === 'next' ? 1 : -1)];
      if (!destination) {
        button.style.visibility = 'hidden';
        continue;
      }
      button.style.visibility = '';
      button.setAttribute('href', destination.getAttribute('href'));
      button.querySelector('[data-pager-name]').textContent = destination.textContent;
    }
  };

  const openPanel = (project, id) => {
    const found = project.panels.findIndex((panel) => panel && panel.id === id);
    const index = found === -1 ? 0 : found;
    project.panels.forEach((panel, panelIndex) => {
      if (panel) panel.hidden = panelIndex !== index;
      const link = project.links[panelIndex];
      if (panelIndex === index) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    updatePager(project, index);
    return project.panels[index];
  };

  const show = (id, scroll) => {
    let target = null;
    projects.forEach((project, projectIndex) => {
      const ownsId = project.panels.some((panel) => panel && panel.id === id);
      const kept = openLink(project);
      const panel = openPanel(project, ownsId ? id : kept.getAttribute('href').slice(1));
      if (ownsId) {
        target = panel;
        activeProject = projectIndex;
      }
    });
    projects.forEach((project, projectIndex) => {
      project.article.hidden = projectLinks.length > 0 && projectIndex !== activeProject;
      const projectLink = projectLinks[projectIndex];
      if (!projectLink) return;
      projectLink.setAttribute('href', openLink(project).getAttribute('href'));
      if (projectIndex === activeProject) projectLink.setAttribute('aria-current', 'true');
      else projectLink.removeAttribute('aria-current');
    });
    const hash = openLink(projects[activeProject]).getAttribute('href');
    document.querySelectorAll('a[data-lang]').forEach((link) => {
      link.setAttribute('href', link.getAttribute('href').split('#')[0] + hash);
    });
    if (target && scroll) {
      if (status) {
        const link = openLink(projects[activeProject]);
        status.textContent = status.getAttribute('data-opened-label') + ': ' + link.textContent;
      }
      if (moveFocus) target.querySelector('h2, h3')?.focus({ preventScroll: true });
      else if (activatedLink) activatedLink.focus({ preventScroll: true });
      moveFocus = false;
      activatedLink = null;
      const top = target.getBoundingClientRect().top + window.pageYOffset - 24;
      if (window.pageYOffset > top) window.scrollTo(0, top);
    }
  };

  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-areas-pager] a')) moveFocus = true;
    activatedLink = event.target?.closest?.('[data-areas-nav] a, [data-projects-nav] a') ?? null;
  });
  window.addEventListener('hashchange', () => show(currentHash(), true));
  show(currentHash(), currentHash() !== '');
})();`
