# menelucas.com — currículo em HTML

## Objetivo
Reescrever o site menelucas.com como um currículo em **HTML semântico** (PT/EN), gerado a partir de **um único arquivo de dados**, com o PDF original disponível só para download. Projeto open source no GitHub do Lucas (github.com/Zeezme), com deploy automático para a AWS. Deve servir também como item de portfólio (código limpo, tipado, testado, README caprichado).

Fases futuras (NÃO fazer agora, só deixar a arquitetura preparada):
- servidor MCP para editar o currículo por conversa (`add_experience`, `update_skills`, `translate`, `publish`);
- temas modulares por design tokens / DESIGN.md;
- backoffice web;
- CLI de deploy com domínio próprio (`npx … deploy --domain`).

## Stack sugerida
- Astro (saída estática) + TypeScript estrito + Tailwind CSS v3/v4 compilado (nada de Tailwind via CDN).
- Dados: `content/resume.json` compatível com **JSON Resume** (https://jsonresume.org/schema), estendido para i18n (campos `{ pt, en }` ou um arquivo por idioma). Validar com Zod no build.
- Testes: Vitest (schema/dados) + Playwright (smoke da página, PT/EN, links, a11y com axe).
- CI/CD: GitHub Actions → build → `aws s3 sync` → invalidação do CloudFront. Autenticação via **OIDC** (role IAM com escopo mínimo no bucket e na distribuição). Sem chaves de acesso no repositório.
- PDFs: manter os PDFs originais como estão (`cv.pdf`, `cv-en.pdf`). (Opcional, fase 2: gerar PDF do próprio HTML com Playwright `page.pdf()`.)

## Conteúdo
- Fonte do conteúdo: os PDFs atuais.
  - PT: `C:\Users\Windows\Documents\cv.pdf` (também em https://menelucas.com/cv.pdf)
  - EN: https://menelucas.com/cv-en.pdf (no bucket como `cv-en.pdf`)
- Extrair o texto dos PDFs para o `resume.json` sem inventar nada. Manter números exatamente como estão (ex.: 20 mil usuários em ~175 ms; endpoint 26–36% mais rápido; benchmarks de até 3 milhões de registros).
- Contatos: LinkedIn https://www.linkedin.com/in/meneluca · GitHub https://github.com/Zeezme · e-mail lukascass@gmail.com · WhatsApp https://wa.me/5511961750560?text=Ol%C3%A1%2C%20Lucas!%20Vi%20seu%20curr%C3%ADculo%20em%20menelucas.com
- Não publicar CPF, endereço completo ou qualquer dado sensível.

## Design
- Seguir o design system do **Linear**: `C:\Users\Windows\Documents\LM\awesome-design-md\design-md\linear.app\DESIGN.md`
  - fundo quase preto com leve tom azul, superfícies em degraus (surface-1..4), bordas hairline, um único acento (azul `#3b82f6`, igual ao banner), Inter 400/500/600, tracking negativo em títulos, botões com raio 8px, toggles em pílula.
- Referência visual do estado atual: https://menelucas.com/preview.html (header com avatar, nome/cargo, ícones sociais, toggle PT|EN em pílula, botão "Baixar PDF").
- Layout do currículo: coluna de leitura (~720px), seções com h2 (Resumo, Competências, Experiência, Formação, Idiomas), experiências com cargo, empresa, período, local e bullets. Responsivo de verdade (sem "folha A4 com zoom").
- Revisar tudo contra:
  - `C:\Users\Windows\Documents\LM\web-interface-guidelines\AGENTS.md` (checklist MUST/SHOULD/NEVER da Vercel)
  - `C:\Users\Windows\Documents\LM\ui-guides-agent-rules\` (consultar `public/llms.txt` → regras específicas por id)
  - Pontos que não podem faltar: semântica h1–h6, skip link, foco visível, `prefers-reduced-motion`, `color-scheme: dark`, `theme-color` igual ao fundo, alvos de toque ≥44px no mobile, ícones com `aria-label`, `tabular-nums` em números, contraste (APCA), sem scroll horizontal, safe areas.

## Requisitos funcionais
1. PT/EN: detectar pelo idioma do navegador (`navigator.languages`; pt* → PT, resto → EN), botão PT|EN que lembra a escolha (localStorage, com try/catch). Idealmente rotas `/` (PT) e `/en/` geradas estaticamente, com `hreflang`, para SEO; a detecção só redireciona na primeira visita.
2. Botão "Baixar PDF" / "Download PDF" apontando para o PDF do idioma ativo.
3. Open Graph / Twitter: título, descrição, `og:image` = `https://menelucas.com/banner.jpg` (1200×630), `summary_large_image`. Manter os arquivos `banner.jpg` e `og.jpg` que já estão no bucket.
4. Favicon e apple-touch-icon com a foto (gerar a partir de `C:\Users\Windows\Documents\foto_sem_fundo.png` ou do avatar atual do preview).
5. Dados estruturados JSON-LD (`Person`) para SEO.
6. Impressão: `@media print` limpo (fundo branco), como alternativa ao PDF.
7. Performance: página estática, sem JS pesado, Lighthouse ≥95 em todas as categorias.

## Infraestrutura atual (já existe — reutilizar, não recriar)
- Conta AWS: 861601215563
- Bucket S3 (privado, sa-east-1): `lucas-menezes-cv-861601215563-sa-east-1`
  - Contém hoje: `index.html`, `preview.html`, `cv.pdf`, `cv-en.pdf`, `cv_en.pdf` (duplicado, pode apagar), `banner.jpg`, `og.jpg`
- CloudFront: distribuição `E3C8ULS0AL34JE` (d20qyititjpe1f.cloudfront.net), acesso ao bucket via OAC `E1HAYH4BH9W45S`, default root object `index.html`, aliases `menelucas.com` e `www.menelucas.com`
- ACM (us-east-1): `arn:aws:acm:us-east-1:861601215563:certificate/7dbd5612-e2fe-40c2-aec6-d957575361aa`
- Route 53: hosted zone `Z0927230RS87TTA6TL3S` (menelucas.com), registros A/AAAA alias para o CloudFront. Domínio registrado no GoDaddy com os nameservers da AWS.
- Atenção: com Astro gerando `/en/index.html`, configurar uma CloudFront Function para resolver `/en/` → `/en/index.html` (o default root object só vale para a raiz).
- Opcional: descrever essa infra em CDK ou Terraform no repo (importando os recursos existentes), como base da futura CLI de deploy.

## Entregáveis
- Repositório novo `Zeezme/menelucas.com` (ou nome melhor sugerido), público.
- README com: o que é, screenshot, stack, arquitetura (diagrama), como rodar localmente, como editar o currículo (`resume.json`), como funciona o deploy, roadmap (MCP, temas, backoffice).
- CI verde (lint, typecheck, testes, build) e deploy automático na branch `main`.
- Site publicado em https://menelucas.com substituindo o `index.html` atual. Testar antes em `preview.html` ou num caminho de staging.

## Critérios de pronto
- Conteúdo idêntico ao dos PDFs (PT e EN), sem nada inventado.
- Checklist da Vercel revisado item a item (deixar o resultado no PR ou no README).
- axe sem violações, Lighthouse ≥95, funcionando bem em 375px, 768px, 1440px e ultra-wide.
- Prévia correta ao colar o link no WhatsApp e no LinkedIn.
