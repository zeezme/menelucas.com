/** Cor de fundo de cada tema, também usada na `<meta name="theme-color">`. */
export const THEME_COLORS = { dark: '#010102', light: '#ffffff' } as const

/**
 * Script inline, executado antes da primeira pintura para evitar o flash do tema errado:
 * - usa a escolha salva em `localStorage.theme` ou, sem ela, o tema do sistema;
 * - acompanha as mudanças do sistema enquanto a pessoa não escolheu um tema manualmente;
 * - o botão `[data-theme-toggle]` alterna o tema e salva a escolha (em `try/catch`, para o armazenamento bloqueado);
 * - mantém a `<meta name="theme-color">` igual ao fundo do tema ativo e o `aria-pressed` do botão em dia;
 * - desliga as transições durante a troca (`data-theme-switching`), para que os itens selecionados não pisquem.
 */
export const themeScript = `(() => {
  const root = document.documentElement;
  const systemPrefersLight = matchMedia('(prefers-color-scheme: light)');
  root.setAttribute('data-js', '');
  const savedTheme = () => {
    try {
      const value = localStorage.getItem('theme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  };
  const systemTheme = () => (systemPrefersLight.matches ? 'light' : 'dark');
  const syncToggles = (theme) => {
    document.querySelectorAll('[data-theme-toggle]').forEach((toggle) => toggle.setAttribute('aria-pressed', String(theme === 'dark')));
  };
  document.addEventListener('DOMContentLoaded', () => syncToggles(root.getAttribute('data-theme')));
  const applyTheme = (theme) => {
    root.setAttribute('data-theme-switching', '');
    root.setAttribute('data-theme', theme);
    const color = theme === 'light' ? '${THEME_COLORS.light}' : '${THEME_COLORS.dark}';
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', color);
      meta.removeAttribute('media');
    });
    syncToggles(theme);
    getComputedStyle(root).color;
    requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute('data-theme-switching')));
  };
  applyTheme(savedTheme() || systemTheme());
  try {
    systemPrefersLight.addEventListener('change', () => {
      if (!savedTheme()) applyTheme(systemTheme());
    });
  } catch (error) {}
  document.addEventListener('click', (event) => {
    if (!event.target?.closest?.('[data-theme-toggle]')) return;
    const nextTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    try { localStorage.setItem('theme', nextTheme); } catch (error) {}
  });
})();`
