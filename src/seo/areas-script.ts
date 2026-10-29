/**
 * Script inline da página de projetos: transforma a lista de partes do sistema em uma barra lateral
 * que abre uma parte por vez (melhoria progressiva: sem JS, todas as partes ficam visíveis em sequência).
 *  - com mais de um projeto, o menu de projetos mostra um por vez (sem JS, ficam todos em sequência);
 *  - cada projeto tem a sua barra lateral e a sua parte aberta; o `#id` da URL escolhe a parte (e o projeto) (link direto, voltar/avançar funcionam via hashchange);
 *  - no fim de cada parte, botões Anterior/Próxima (a barra lateral fica no topo, longe no celular);
 *  - a parte aberta recebe `aria-current` no link e as demais ganham o atributo `hidden`.
 */
export const areasScript = `(function(){
var navs=[].slice.call(document.querySelectorAll('[data-areas-nav]'));
if(!navs.length)return;
function current(){try{return decodeURIComponent(location.hash.slice(1))}catch(_){return ''}}
var projects=navs.map(function(nav){
var links=[].slice.call(nav.querySelectorAll('a[href^="#"]'));
return{
article:nav.closest('article'),
links:links,
panels:links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))}),
pager:nav.closest('article').querySelector('[data-areas-pager]')
};
});
function setPager(p,idx){
if(!p.pager)return;
p.pager.hidden=false;
['prev','next'].forEach(function(dir){
var a=p.pager.querySelector('[data-pager="'+dir+'"]');
var to=p.links[idx+(dir==='next'?1:-1)];
if(!to){a.style.visibility='hidden';return}
a.style.visibility='';
a.setAttribute('href',to.getAttribute('href'));
a.querySelector('[data-pager-name]').textContent=to.textContent;
});
}
function open(p,id){
var idx=0,i;
for(i=0;i<p.panels.length;i++){if(p.panels[i]&&p.panels[i].id===id){idx=i}}
for(i=0;i<p.panels.length;i++){
var on=i===idx;
if(p.panels[i])p.panels[i].hidden=!on;
if(on){p.links[i].setAttribute('aria-current','true')}else{p.links[i].removeAttribute('aria-current')}
}
setPager(p,idx);
return p.panels[idx];
}
var active=0;
var projectLinks=[].slice.call(document.querySelectorAll('[data-project-link]'));
function show(id,scroll){
var target=null,owner=-1;
projects.forEach(function(p,n){
var has=p.panels.some(function(el){return el&&el.id===id});
var keep=p.links.filter(function(a){return a.getAttribute('aria-current')})[0];
var panel=open(p,has?id:keep?keep.getAttribute('href').slice(1):'');
if(has){target=panel;owner=n}
});
if(owner>-1)active=owner;
projects.forEach(function(p,n){
p.article.hidden=projectLinks.length>0&&n!==active;
var pl=projectLinks[n];
if(pl){
var cur=p.links.filter(function(a){return a.getAttribute('aria-current')})[0]||p.links[0];
pl.setAttribute('href',cur.getAttribute('href'));
if(n===active){pl.setAttribute('aria-current','true')}else{pl.removeAttribute('aria-current')}
}
});
var shown=projects[active].links.filter(function(a){return a.getAttribute('aria-current')})[0]||projects[active].links[0];
var h=shown.getAttribute('href');
[].slice.call(document.querySelectorAll('a[data-lang]')).forEach(function(a){
var b=a.getAttribute('href').split('#')[0];a.setAttribute('href',b+h)});
if(target&&scroll){
var top=target.getBoundingClientRect().top+window.pageYOffset-24;
if(window.pageYOffset>top)window.scrollTo(0,top);
}
}
window.addEventListener('hashchange',function(){show(current(),true)});
show(current(),current()!=='');
})();`
