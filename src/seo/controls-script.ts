/**
 * Script inline dos controles de todas as páginas:
 * - o botão `[data-back-to-top]` aparece depois de rolar uma tela e meia e leva ao topo, com rolagem suave só se a
 *   pessoa não pediu menos movimento; o foco vai para o primeiro controle da página, para o teclado continuar de lá;
 * - a tecla Esc dispensa as dicas (`.tooltip`) enquanto o ponteiro ou o foco não mudarem (WCAG 1.4.13).
 */
export const controlsScript = `(() => {
  const root = document.documentElement;
  const backToTop = document.querySelector('[data-back-to-top]');
  if (backToTop) {
    const updateVisibility = () => {
      backToTop.hidden = window.scrollY < window.innerHeight * 1.5;
    };
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    backToTop.addEventListener('click', () => {
      const prefersLessMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersLessMotion ? 'auto' : 'smooth' });
      document.querySelector('header a, header button')?.focus({ preventScroll: true });
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') root.setAttribute('data-tooltips-dismissed', '');
  });
  const restoreTooltips = () => root.removeAttribute('data-tooltips-dismissed');
  document.addEventListener('pointermove', restoreTooltips, { passive: true });
  document.addEventListener('focusin', restoreTooltips);
})();`
