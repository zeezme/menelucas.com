# Infraestrutura (AWS)

Tudo já existe na conta; este diretório documenta o que o deploy precisa e o que falta configurar.
**Sem EC2 e sem servidores**: o site é HTML estático em um bucket S3 privado, servido pelo CloudFront.

| Recurso | Valor |
| --- | --- |
| Bucket S3 (privado, `sa-east-1`) | `lucas-menezes-cv-861601215563-sa-east-1` |
| CloudFront | `E3C8ULS0AL34JE` (`d20qyititjpe1f.cloudfront.net`), OAC `E1HAYH4BH9W45S` |
| Aliases | `menelucas.com`, `www.menelucas.com` |
| ACM (`us-east-1`) | `7dbd5612-e2fe-40c2-aec6-d957575361aa` |
| Route 53 | zona `Z0927230RS87TTA6TL3S` |

## Passos únicos (manuais, feitos por você)

1. **CloudFront Function**: criar uma função com o conteúdo de [`cloudfront-function.js`](cloudfront-function.js),
   publicar e associar à distribuição como *viewer request* do comportamento padrão. Sem ela, `/en/` não resolve para `/en/index.html`.
2. **Provedor OIDC do GitHub** (se ainda não existir): `token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
3. **Role de deploy** (ex.: `menelucas-site-deploy`):
   - trust policy: [`iam-oidc-trust-policy.json`](iam-oidc-trust-policy.json) (só a branch `main` do repositório);
   - permissões: [`iam-deploy-policy.json`](iam-deploy-policy.json) (listar, escrever e apagar objetos do bucket, e invalidar a distribuição; nada além disso. O apagar serve ao `s3 sync --delete`, que tira do bucket o que saiu do site).
4. No GitHub, em *Settings → Secrets and variables → Actions → Variables*, criar `AWS_ROLE_ARN` com o ARN da role.
   É uma variável, não um segredo: não há chaves de acesso no repositório.

## Limpeza opcional

`cv_en.pdf` (duplicado de `cv-en.pdf`) e o `preview.html` antigo podem ser removidos do bucket depois que o novo site estiver no ar.

## Custos

S3 + CloudFront para um currículo ficam em centavos por mês. GitHub Actions é gratuito em repositório público.
