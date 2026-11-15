# QuotaMob PWA e notificações push

## PWA implementado
- Manifesto: `/manifest.webmanifest`.
- Service Worker: `/sw.js`.
- Ícones SVG quadrados em 192 e 512 px.
- Registo automático do Service Worker.
- Não são colocados em cache dados privados, sessões, comprovativos ou respostas da API.
- O domínio de produção já usa HTTPS.

## Preparação para PWABuilder
URL de produção: https://quotamobv1.vercel.app

1. Publicar/validar a versão final em produção.
2. Abrir https://www.pwabuilder.com/ e inserir a URL acima.
3. Validar o Manifest e Service Worker.
4. Em Icons, usar o ícone QuotaMob como origem e gerar o conjunto PNG para Android (192 e 512 px, incluindo maskable).
5. Em Package for stores → Android, escolher Other Android para gerar APK de teste ou Google Play para o pacote de publicação.
6. Activar Notification Delegation no pacote Android, porque o QuotaMob terá push.
7. Testar a aplicação instalada num Android real antes de distribuir.

A documentação do PWABuilder pede um PWA publicado com HTTPS e manifesto válido; para Android recomenda ícone PNG quadrado de 512 px e opção de delegação de notificações quando a app usa push.

## Push notifications implementado
- Tabela `public.push_subscriptions`: guarda endpoint e chaves de subscrição de cada administrador activo; RLS limita cada administrador aos seus próprios dispositivos.
- Tabela `public.push_events`: outbox interna, sem acesso de leitura/escrita por `anon` ou `authenticated`.
- Trigger: quando um pagamento é inserido com estado `em_analise`, cria um evento interno.
- Edge Function: `quotamob-push`, activa no Supabase. Recebe o Database Webhook, identifica administradores activos e envia a notificação. Subscrições expiradas são removidas.
- A interface do administrador tem o botão **Activar alertas**.

## Configuração obrigatória no Dashboard Supabase
A função não envia notificações até os segredos e o webhook serem configurados.

### Edge Function secrets
Em Supabase → Edge Functions → Secrets, adicionar:
- `QUOTAMOB_PUSH_WEBHOOK_SECRET`: usar o segredo fornecido separadamente ao responsável pelo projecto.
- `QUOTAMOB_VAPID_PUBLIC_KEY`: chave pública VAPID que está no ficheiro `src/lib/push.js`.
- `QUOTAMOB_VAPID_PRIVATE_KEY`: chave privada VAPID fornecida separadamente; nunca a colocar no GitHub nem no frontend.
- `QUOTAMOB_VAPID_SUBJECT`: `https://quotamobv1.vercel.app`.

As variáveis de sistema `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são usadas pela função; não as copiar para o frontend.

### Database Webhook
Em Supabase → Database → Webhooks:
1. Criar webhook com nome `quotamob_push_new_payment`.
2. Tabela: `public.push_events`.
3. Evento: apenas `INSERT`.
4. Tipo de destino: Supabase Edge Function.
5. Função: `quotamob-push`; método POST.
6. Header adicional: `x-quotamob-hook-secret` com o mesmo valor de `QUOTAMOB_PUSH_WEBHOOK_SECRET`.
7. Content-Type: `application/json`.
8. Guardar.

## Teste de ponta a ponta
1. Publicar a versão que contém o botão **Activar alertas**.
2. Entrar no QuotaMob num Android como administrador activo.
3. Tocar em **Activar alertas** e permitir notificações.
4. Confirmar que a subscrição foi gravada em `push_subscriptions`.
5. Num segundo dispositivo/sessão, entrar como motorista e submeter um comprovativo.
6. Confirmar que é criado um registo em `push_events` e que o administrador recebe **Novo pagamento recebido**.
7. Tocar na notificação e confirmar que abre `/admin/aprovacoes`.

O envio remoto e o teste de ponta a ponta ficam pendentes até os segredos e o Database Webhook serem configurados no Dashboard.
