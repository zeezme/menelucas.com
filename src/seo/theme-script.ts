export const THEME_COLORS = { dark: '#010102', light: '#ffffff' } as const

/**
 * Script inline que roda antes da primeira pintura (evita flash de tema errado):
 *  - usa a escolha salva (`localStorage.theme`) ou, sem ela, o tema do sistema;
 *  - acompanha mudanças do sistema enquanto o usuário não escolheu manualmente;
 *  - o botão `[data-theme-toggle]` alterna e salva (try/catch para storage bloqueado);
 *  - mantém `<meta name="theme-color">` igual ao fundo do tema ativo.
 */
export const themeScript = `(function(){
var d=document.documentElement,mq=matchMedia('(prefers-color-scheme: light)');
d.setAttribute('data-js','');
function saved(){try{var v=localStorage.getItem('theme');return v==='light'||v==='dark'?v:null}catch(_){return null}}
function apply(t){
d.setAttribute('data-theme',t);
var c=t==='light'?'${THEME_COLORS.light}':'${THEME_COLORS.dark}',m=document.querySelectorAll('meta[name="theme-color"]');
for(var i=0;i<m.length;i++){m[i].setAttribute('content',c);m[i].removeAttribute('media')}
}
apply(saved()||(mq.matches?'light':'dark'));
try{mq.addEventListener('change',function(){if(!saved())apply(mq.matches?'light':'dark')})}catch(_){}
document.addEventListener('click',function(e){
var b=e.target&&e.target.closest&&e.target.closest('[data-theme-toggle]');
if(!b)return;
var n=d.getAttribute('data-theme')==='light'?'dark':'light';
apply(n);
try{localStorage.setItem('theme',n)}catch(_){}
});
})();`
