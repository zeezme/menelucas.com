/**
 * Script inline da página de projetos: transforma a lista de partes do sistema em uma barra lateral
 * que abre uma parte por vez (melhoria progressiva: sem JS, todas as partes ficam visíveis em sequência).
 *  - o `#id` da URL escolhe a parte aberta (link direto, voltar/avançar funcionam via hashchange);
 *  - a parte aberta recebe `aria-current` no link e as demais ganham o atributo `hidden`.
 */
export const areasScript = `(function(){
var nav=document.querySelector('[data-areas-nav]');
if(!nav)return;
var links=[].slice.call(nav.querySelectorAll('a[href^="#"]'));
var panels=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
function show(id,scroll){
var idx=0,i;
for(i=0;i<panels.length;i++){if(panels[i]&&panels[i].id===id){idx=i}}
for(i=0;i<panels.length;i++){
var on=i===idx;
if(panels[i])panels[i].hidden=!on;
if(on){links[i].setAttribute('aria-current','true')}else{links[i].removeAttribute('aria-current')}
}
var h='#'+panels[idx].id;
[].slice.call(document.querySelectorAll('a[data-lang]')).forEach(function(a){
var b=a.getAttribute('href').split('#')[0];a.setAttribute('href',b+h)});
if(scroll&&panels[idx]){
var top=panels[idx].getBoundingClientRect().top+window.pageYOffset-24;
if(window.pageYOffset>top)window.scrollTo(0,top);
}
}
function current(){try{return decodeURIComponent(location.hash.slice(1))}catch(_){return ''}}
window.addEventListener('hashchange',function(){show(current(),true)});
show(current(),false);
})();`
