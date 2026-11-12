import { getLigacao } from '@/lib/supabaseConfig';

const CHAVE_SESSAO = 'quotamob.sessao';

function cabecalhos(token, anonKey) {
  return { apikey: anonKey, Authorization: `Bearer ${token || anonKey}`, 'Content-Type': 'application/json' };
}

function guardarSessao(dados, anterior = {}) {
  if (!dados?.access_token || !dados?.refresh_token) {
    throw new Error('O Supabase não devolveu uma sessão válida após a verificação.');
  }
  const sessao = {
    access_token: dados.access_token,
    refresh_token: dados.refresh_token,
    expira_em: Date.now() + (Number(dados.expires_in) || 3600) * 1000,
    utilizador: dados.user || anterior.utilizador,
  };
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  return sessao;
}

async function authPedido(caminho, sessao, { metodo = 'GET', corpo } = {}) {
  const { url, anonKey } = getLigacao();
  if (!url || !anonKey) throw new Error('O QuotaMob ainda não está ligado à base de dados.');
  const resposta = await fetch(`${url}/auth/v1/${caminho}`, {
    method: metodo,
    headers: cabecalhos(sessao?.access_token, anonKey),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const detalhe = dados?.msg || dados?.message || dados?.error_description || dados?.error;
    throw new Error(detalhe || 'Não foi possível concluir a verificação de segurança.');
  }
  return dados;
}

function telefoneParaEmail(telefone) {
  return `${String(telefone || '').replace(/\D/g, '')}@quotamob.app`;
}

function normalizarFatores(dados) {
  if (Array.isArray(dados?.factors)) return dados.factors;
  if (Array.isArray(dados?.all)) return dados.all;
  if (Array.isArray(dados)) return dados;
  return [...(dados?.totp || []), ...(dados?.phone || [])];
}

export async function iniciarSessaoComMfa(telefone, palavraPasse) {
  const { url, anonKey } = getLigacao();
  const resposta = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: cabecalhos(null, anonKey),
    body: JSON.stringify({ email: telefoneParaEmail(telefone), password: palavraPasse }),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const detalhe = String(dados?.error_description || dados?.msg || dados?.error || '').toLowerCase();
    if (detalhe.includes('invalid login')) throw new Error('Número ou palavra-passe incorretos.');
    if (detalhe.includes('email not confirmed')) throw new Error('Esta conta ainda não está activada. Contacta a administração.');
    throw new Error('Não foi possível entrar. Verifica a ligação e tenta novamente.');
  }

  const sessaoPendente = {
    access_token: dados.access_token,
    refresh_token: dados.refresh_token,
    expira_em: Date.now() + (Number(dados.expires_in) || 3600) * 1000,
    utilizador: dados.user,
  };
  const fatores = normalizarFatores(await authPedido('factors', sessaoPendente));
  const fator = fatores.find((item) => item.factor_type === 'totp' && item.status === 'verified');
  if (fator) return { mfaRequired: true, sessao: sessaoPendente, factorId: fator.id };

  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessaoPendente));
  return { mfaRequired: false, sessao: sessaoPendente };
}

export async function verificarMfaLogin({ sessao, factorId, codigo }) {
  const desafio = await authPedido(`factors/${encodeURIComponent(factorId)}/challenge`, sessao, { metodo: 'POST', corpo: {} });
  const challengeId = desafio.id || desafio.challenge_id;
  if (!challengeId) throw new Error('Não foi possível iniciar o desafio do autenticador. Tenta novamente.');
  const resultado = await authPedido(`factors/${encodeURIComponent(factorId)}/verify`, sessao, {
    metodo: 'POST',
    corpo: { challenge_id: challengeId, code: String(codigo).replace(/\D/g, '') },
  });
  return guardarSessao(resultado, sessao);
}

export async function listarFatoresMfa() {
  const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null');
  if (!sessao?.access_token) throw new Error('A sessão expirou. Entra novamente.');
  return normalizarFatores(await authPedido('factors', sessao));
}

export async function iniciarRegistoTotp(nome = 'QuotaMob') {
  const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null');
  if (!sessao?.access_token) throw new Error('A sessão expirou. Entra novamente.');
  return authPedido('factors', sessao, { metodo: 'POST', corpo: { factor_type: 'totp', friendly_name: nome } });
}

export async function confirmarRegistoTotp(factorId, codigo) {
  const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null');
  if (!sessao?.access_token) throw new Error('A sessão expirou. Entra novamente.');
  const desafio = await authPedido(`factors/${encodeURIComponent(factorId)}/challenge`, sessao, { metodo: 'POST', corpo: {} });
  const challengeId = desafio.id || desafio.challenge_id;
  if (!challengeId) throw new Error('Não foi possível iniciar a confirmação. Tenta novamente.');
  const resultado = await authPedido(`factors/${encodeURIComponent(factorId)}/verify`, sessao, {
    metodo: 'POST',
    corpo: { challenge_id: challengeId, code: String(codigo).replace(/\D/g, '') },
  });
  return guardarSessao(resultado, sessao);
}

export async function removerFatorTotp(factorId) {
  const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null');
  if (!sessao?.access_token) throw new Error('A sessão expirou. Entra novamente.');
  await authPedido(`factors/${encodeURIComponent(factorId)}`, sessao, { metodo: 'DELETE' });
  return true;
}


export async function sessaoMfaExigeDesafio(sessao) {
  const fatores = normalizarFatores(await authPedido('factors', sessao));
  const temTotp = fatores.some((item) => item.factor_type === 'totp' && item.status === 'verified');
  if (!temTotp) return false;
  try {
    const payload = JSON.parse(atob(sessao.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.aal !== 'aal2';
  } catch {
    return true;
  }
}
