# QuotaMob PWA / PWABuilder

## Estado desta etapa
- Manifesto Web App instalado em `/manifest.webmanifest`.
- Service Worker registado em `/sw.js`.
- Ícone SVG da aplicação disponível em `/icons/quotamob.svg`.
- O Service Worker não guarda respostas da API, sessões, comprovativos ou páginas privadas em cache.
- O evento `push` apresenta notificações enviadas pelo servidor; a entrega real ainda depende da subscrição Push, chaves VAPID e função de envio no Supabase.

## Teste de instalação
1. Publicar a versão HTTPS.
2. Abrir o domínio no Chrome Android.
3. Menu ⋮ → Instalar aplicação / Adicionar ao ecrã principal.
4. Confirmar que abre em modo standalone.

## PWABuilder
URL de produção: https://quotamobv1.vercel.app

Validar manifesto, service worker, HTTPS, ícones e comportamento de instalação no PWABuilder. Para publicação Play Store, gerar o pacote Android (TWA) depois de concluir a configuração Push e os testes em dispositivos.

## Push notifications — configuração ainda necessária
Não colocar chaves privadas VAPID no frontend. A chave privada deve ficar como segredo no Supabase Edge Functions. As subscrições devem ser associadas ao UUID do utilizador autenticado e apenas administradores activos devem receber alertas de pagamentos novos.
