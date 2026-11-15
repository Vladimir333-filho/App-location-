import { getLigacao } from '@/lib/supabaseConfig';
import { sessaoValida } from '@/lib/supabaseClient';

// Chave pública VAPID: pode estar no frontend. A chave privada fica apenas nos
// segredos das Supabase Edge Functions.
export const VAPID_PUBLIC_KEY = 'BMlflcqK2nz-mkgS9v_Wobw40OGnRfeEBogEHBhoZ_sJ_KDs0t5Z9yM_EKK0dIt67VwZRJpvmDrCUEAyCEOxDKw';

function chaveUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function guardarSubscricao(subscription) {
  const sessao = await sessaoValida();
  if (!sessao?.access_token || !sessao?.utilizador?.id) {
    throw new Error('A sessão expirou. Entra novamente para activar as notificações.');
  }
  const { url, anonKey } = getLigacao();
  const dados = subscription.toJSON();
  const resposta = await fetch(`${url}/rest/v1/push_subscriptions?on_conflict=user_id,endpoint`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${sessao.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([{
      user_id: sessao.utilizador.id,
      endpoint: dados.endpoint,
      p256dh: dados.keys?.p256dh,
      auth: dados.keys?.auth,
      user_agent: navigator.userAgent.slice(0, 500),
    }]),
  });
  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => '');
    throw new Error(detalhe || 'Não foi possível guardar a subscrição de notificações.');
  }
}

export async function activarNotificacoesPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Este navegador não suporta notificações push. Actualiza o Chrome ou instala a aplicação pelo navegador.');
  }
  if (!VAPID_PUBLIC_KEY) throw new Error('A chave pública de notificações ainda não está configurada.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('As notificações não foram autorizadas neste dispositivo.');

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chaveUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  await guardarSubscricao(subscription);
  return subscription;
}
