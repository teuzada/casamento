# Site de presentes de casamento (GitHub Pages)

Site estático mobile-first para presentes do casamento e padrinhos, com Pix direto.

## Configurar
1. Edite `js/config.js`:
   - `coupleNames`
   - `pixKey` (chave Pix real)
   - `pixKeyType` (informativo)
   - `beneficiaryName` (nome do recebedor)
   - `beneficiaryCity` (cidade, sem acentos preferencialmente)
2. Substitua `assets/casal.jpg` por uma foto de vocês (mantenha o mesmo nome).
3. Publique os arquivos no repositório GitHub e ative **Settings → Pages → Deploy from a branch → main → /(root)**.

## Rotas
- `index.html`: convidados
- `padrinhos.html`: padrinhos (mínimo R$ 1.200)
- `admin.html`: painel local

## Importante sobre Pix e painel
Este é um site estático. O payload Pix e QR Code são gerados no navegador com a chave configurada e valor selecionado. O recebedor e a chave devem ser válidos para que o app bancário aceite o pagamento. Faça teste com valor baixo.

O site não consulta banco, não recebe webhook e não confirma transações. O botão “Já fiz o Pix” grava um registro apenas no `localStorage` do navegador atual; o painel admin só verá esses registros nesse mesmo navegador/aparelho. Isso não é um painel administrativo compartilhado nem confirmação de pagamento.

Não coloque senhas, tokens ou dados secretos em arquivos frontend. Para confirmação automática e painel sincronizado entre dispositivos, será necessário backend (por exemplo Supabase + provedor Pix) e políticas de segurança.

O QR Code é carregado pela biblioteca QRCode.js via CDN; precisa de conexão à internet para gerar a imagem.
