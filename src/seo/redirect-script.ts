/**
 * Script inline (sem dependências) que roda antes da primeira pintura:
 *  - grava a escolha do botão PT|EN no localStorage (try/catch);
 *  - na página PT (`data-en-url` no <html>), se o idioma do navegador/preferência for EN,
 *    redireciona para a versão EN. Só decide uma vez: a escolha fica salva.
 * A regra de detecção espelha `detectLocale` em src/i18n: pt* → PT, resto → EN.
 */
export const redirectScript = `(function(){
var d=document.documentElement;
document.addEventListener('click',function(e){
var a=e.target&&e.target.closest&&e.target.closest('[data-lang]');
if(a){try{localStorage.setItem('lang',a.getAttribute('data-lang'))}catch(_){}}
});
var en=d.getAttribute('data-en-url');
if(!en)return;
var saved=null;
try{saved=localStorage.getItem('lang')}catch(_){}
var target=saved;
if(target!=='pt'&&target!=='en'){
var l=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];
target=/^pt/i.test(l[0]||'')?'pt':'en';
try{localStorage.setItem('lang',target)}catch(_){}
}
if(target==='en')location.replace(en);
})();`
