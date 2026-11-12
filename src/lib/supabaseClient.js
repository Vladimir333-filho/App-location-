import { getLigacao } from '@/lib/supabaseConfig';

const CHAVE_SESSAO = 'quotamob.sessao';
export const BUCKET_COMPROVATIVOS = 'comprovativos';

function config() {
  const { url, anonKey } = getLigacao();
  if (!url || !anonKey) {
    throw new Error('O QuotaMob ainda não está ligado à base de dados.');
  }
  return { url, anonKey };
}

export const MENSAGEM_SEM_REDE =
  'Não foi possível ligar ao servidor do QuotaMob. Confirma a tua internet e tenta outra vez. Se o problema continuar, a base de dados pode estar em pausa no Supabase (plano gratuito) — abre o painel do Supabase e reactiva o projeto.';

// Uma falha de rede no browser chega como "Failed to fetch", que não explica nada
// a quem está a entrar. Tentamos mais uma vez e, se continuar, falamos português.
async function pedidoFetch(endereco, opcoes = {}, tentativas = 2) {
  for (let tentativa = 1; ; tentativa += 1) {
    try {
      return await globalThis.fetch(endereco, opcoes);
    } catch {
      if (tentativa >= tentativas) throw new Error(MENSAGEM_SEM_REDE);
      await new Promise((resolver) => setTimeout(resolver, 600));
    }
  }
}

export function telefoneParaEmail(telefone) {
  return `${String(telefone || '').replace(/\D/g, '')}@quotamob.app`;
}

export function lerSessao() {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function gravarSessao(sessao) {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function apagarSessao() {
  localStorage.removeItem(CHAVE_SESSAO);
}

function cabecalhos(token, anonKey) {
  return { apikey: anonKey, Authorization: `Bearer ${token || anonKey}` };
}

async function pedirToken(telefone, palavraPasse) {
  const { url, anonKey } = config();
  const resposta = await pedidoFetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { ...cabecalhos(null, anonKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: telefoneParaEmail(telefone), password: palavraPasse }),
  });
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const detalhe = String(dados?.error_description || dados?.msg || dados?.error || '').toLowerCase();
    if (detalhe.includes('invalid login')) throw new Error('Número ou palavra-passe incorretos.');
    if (detalhe.includes('email not confirmed')) {
      throw new Error('Esta conta ainda não está ativada. Em "Recuperar palavra-passe" defines uma nova e fica ativa.');
    }
    throw new Error('Não foi possível entrar. Verifica a tua ligação à internet.');
  }

  return dados;
}

const SEM_SCRIPT =
  'A reposição automática ainda não está ligada. No painel, abre Configurações e copia o script para o Supabase.';

// Chama uma função criada no Supabase (SQL) que trata das contas de autenticação.
async function chamarFuncao(nome, corpo) {
  const { url, anonKey } = config();
  const sessao = await sessaoValida();
  const resposta = await pedidoFetch(`${url}/rest/v1/rpc/${nome}`, {
    method: 'POST',
    headers: { ...cabecalhos(sessao?.access_token, anonKey), 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo || {}),
  });

  const texto = await resposta.text().catch(() => '');
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    const detalhe = String(dados?.message || dados?.hint || dados?.details || texto || '').trim();
    if (resposta.status === 404 || detalhe.includes('Could not find the function')) {
      throw new Error(SEM_SCRIPT);
    }
    throw new Error(detalhe ? detalhe.replace(/^[A-Z0-9]+:\s*/, '') : 'Não foi possível concluir a operação.');
  }

  return dados;
}

// Tesoureiro repõe a palavra-passe de um motorista (não precisa da antiga).
export async function reporPalavraPasse(telefone, palavraPasseNova) {
  await chamarFuncao('quotamob_admin_definir_senha', {
    p_telefone: telefone,
    p_senha: palavraPasseNova,
  });
  return true;
}

// Contas antigas que ficaram na autenticação: a palavra-passe é redefinida e o
// número pode voltar a ser usado. Devolve o id do utilizador.
export async function definirSenhaExistente(telefone, palavraPasseNova) {
  return chamarFuncao('quotamob_admin_definir_senha', {
    p_telefone: telefone,
    p_senha: palavraPasseNova,
  });
}

// Recuperação OTP por Edge Function, sem exigir sessão autenticada.
async function chamarRecuperacaoOtp(corpo) {
  const { url, anonKey } = config();
  const resposta = await pedidoFetch(`${url}/functions/v1/quotamob-recuperar-senha`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados?.error || 'Não foi possível concluir a recuperação. Tenta novamente.');
  return dados;
}

export async function solicitarOtpRecuperacao(telefone) {
  return chamarRecuperacaoOtp({ action: 'send', phone: telefone });
}

export async function confirmarOtpRecuperacao({ telefone, otpId, codigo, novaPalavraPasse }) {
  return chamarRecuperacaoOtp({ action: 'verify', phone: telefone, otp_id: otpId, code: codigo, new_password: novaPalavraPasse });
}

// Motorista repõe a palavra-passe sozinho, sem passar pelo tesoureiro.
export async function reporSenhaAutomatica({ telefone, nome, palavraPasse }) {
  await chamarFuncao('quotamob_repor_senha', {
    p_telefone: telefone,
    p_nome: nome,
    p_nova: palavraPasse,
  });
  return true;
}

// Número que já tem conta na autenticação mas ficou sem perfil (motorista
// apagado antes): a conta é reaproveitada e o perfil recriado.
export async function activarNumeroExistente({ telefone, nome, palavraPasse }) {
  return chamarFuncao('quotamob_activar_numero', {
    p_telefone: telefone,
    p_nome: String(nome || '').trim(),
    p_senha: palavraPasse,
  });
}

// Reconstitui apenas o perfil em falta, mantendo o UUID e a palavra-passe da conta Auth.
export async function reconciliarPerfilOrfao({ telefone, nome }) {
  return chamarFuncao('quotamob_reconciliar_perfil_orfao', {
    p_telefone: String(telefone || '').replace(/\D/g, ''),
    p_nome: String(nome || '').trim(),
  });
}

// Apaga a conta de autenticação de um motorista eliminado. Sem isto, o número
// fica preso para sempre e ninguém o consegue voltar a registar.
export async function apagarContaAutenticacao(utilizadorId) {
  return chamarFuncao('quotamob_apagar_motorista', { p_id: utilizadorId });
}

export async function entrar(telefone, palavraPasse) {
  const dados = await pedirToken(telefone, palavraPasse);

  const sessao = {
    access_token: dados.access_token,
    refresh_token: dados.refresh_token,
    expira_em: Date.now() + (Number(dados.expires_in) || 3600) * 1000,
    utilizador: dados.user,
  };
  gravarSessao(sessao);
  return sessao;
}

async function renovarSessao(sessao) {
  const { url, anonKey } = config();
  const resposta = await pedidoFetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { ...cabecalhos(null, anonKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: sessao.refresh_token }),
  });
  if (!resposta.ok) throw new Error('Sessão expirada.');
  const dados = await resposta.json();
  const nova = {
    access_token: dados.access_token,
    refresh_token: dados.refresh_token || sessao.refresh_token,
    expira_em: Date.now() + (Number(dados.expires_in) || 3600) * 1000,
    utilizador: dados.user || sessao.utilizador,
  };
  gravarSessao(nova);
  return nova;
}

// Uma única renovação em curso: o Supabase troca o refresh_token a cada uso, por
// isso pedidos em paralelo não podem renovar ao mesmo tempo (perdiam a sessão).
let renovacaoEmCurso = null;

export async function sessaoValida() {
  const sessao = lerSessao();
  if (!sessao) return null;
  if (sessao.expira_em && sessao.expira_em - 60000 > Date.now()) return sessao;

  if (!renovacaoEmCurso) {
    renovacaoEmCurso = renovarSessao(sessao)
      .catch((falha) => {
        apagarSessao();
        throw falha;
      })
      .finally(() => {
        renovacaoEmCurso = null;
      });
  }

  try {
    return await renovacaoEmCurso;
  } catch {
    return null;
  }
}

export async function sairDoServidor() {
  try {
    const { url, anonKey } = config();
    const sessao = lerSessao();
    if (!sessao) return;
    await pedidoFetch(`${url}/auth/v1/logout`, {
      method: 'POST',
      headers: { ...cabecalhos(sessao.access_token, anonKey) },
    });
  } catch {
    /* sair localmente mesmo sem rede */
  }
}

export async function registarConta(telefone, palavraPasse, nome, { manterSessao = true } = {}) {
  const { url, anonKey } = config();
  let resposta;
  try {
    resposta = await pedidoFetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: { ...cabecalhos(null, anonKey), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: telefoneParaEmail(telefone),
        password: palavraPasse,
        data: { nome: String(nome || '').trim(), telefone },
      }),
    });
  } catch {
    throw new Error('Não foi possível ligar ao servidor. Verifica a tua ligação à internet.');
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const codigo = String(dados?.error_code || '').toLowerCase();
    const detalhe = String(
      dados?.msg || dados?.error_description || dados?.error || dados?.message || '',
    ).trim();
    const texto = detalhe.toLowerCase();

    if (
      resposta.status === 429 ||
      codigo.includes('rate_limit') ||
      texto.includes('rate limit') ||
      texto.includes('too many requests')
    ) {
      throw new Error('Demasiadas tentativas seguidas. Espera um pouco e tenta outra vez.');
    }
    if (codigo === 'email_provider_disabled' || texto.includes('email logins are disabled')) {
      throw new Error(
        'O registo por email está desligado no Supabase. Liga o provider Email em Authentication → Providers → Email.',
      );
    }
    if (codigo === 'signup_disabled' || texto.includes('signups not allowed')) {
      throw new Error('O registo público está desligado no Supabase (Authentication → Sign In / Providers).');
    }
    if (
      codigo === 'user_already_exists' ||
      codigo === 'email_exists' ||
      texto.includes('already')
    ) {
      const existente = new Error('Este número já tem conta criada. Usa "Recuperar palavra-passe".');
      existente.jaExiste = true;
      throw existente;
    }
    if (codigo === 'weak_password' || texto.includes('password')) {
      throw new Error(
        detalhe
          ? `Palavra-passe recusada pelo Supabase: ${detalhe}`
          : 'A palavra-passe não é válida. Usa pelo menos 6 caracteres.',
      );
    }
    if (codigo === 'email_address_invalid' || texto.includes('invalid email')) {
      throw new Error(
        detalhe
          ? `O número não foi aceite como email interno: ${detalhe}`
          : 'Este número não é válido para registo.',
      );
    }
    if (resposta.status >= 500) {
      throw new Error('O servidor não respondeu. Tenta outra vez dentro de instantes.');
    }
    throw new Error(
      detalhe
        ? `Não foi possível criar a conta: ${detalhe}`
        : `Não foi possível criar a conta (erro ${resposta.status}). Tenta outra vez.`,
    );
  }

  if (dados.access_token && dados.refresh_token) {
    const sessao = {
      access_token: dados.access_token,
      refresh_token: dados.refresh_token,
      expira_em: Date.now() + (Number(dados.expires_in) || 3600) * 1000,
      utilizador: dados.user,
    };
    if (manterSessao) gravarSessao(sessao);
    return { utilizador: dados.user, sessao };
  }

  return { utilizador: dados.user || dados, sessao: null };
}

export async function pedir(tabela, { query = '', metodo = 'GET', corpo, prefer } = {}) {
  const { url, anonKey } = config();
  const sessao = await sessaoValida();
  const parametros = query ? `?${query}` : '';
  const resposta = await pedidoFetch(`${url}/rest/v1/${tabela}${parametros}`, {
    method: metodo,
    headers: {
      ...cabecalhos(sessao?.access_token, anonKey),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    const base = `A operação em "${tabela}" falhou (${resposta.status}).`;
    throw new Error(`${base} ${texto.slice(0, 160)}`);
  }
  if (resposta.status === 204) return null;
  const texto = await resposta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

// O Supabase devolve no máximo 1000 linhas por pedido. Sem isto, listas maiores
// ficavam cortadas em silêncio e os totais do painel saíam errados.
export async function pedirTudo(tabela, query = '', { pagina = 1000, maximo = 20000 } = {}) {
  const base = String(query || '')
    .replace(/(^|&)limit=\d+/g, '')
    .replace(/(^|&)offset=\d+/g, '')
    .replace(/^&+|&+$/g, '');
  const linhas = [];

  for (let inicio = 0; inicio < maximo; inicio += pagina) {
    const fatia = await pedir(tabela, {
      query: `${base ? `${base}&` : ''}limit=${pagina}&offset=${inicio}`,
    });
    if (!Array.isArray(fatia) || fatia.length === 0) break;
    linhas.push(...fatia);
    if (fatia.length < pagina) break;
  }

  return linhas;
}

// Conta no servidor (Prefer: count=exact) em vez de transferir as linhas.
export async function contarLinhas(tabela, query = '') {
  const { url, anonKey } = config();
  const sessao = await sessaoValida();
  const parametros = query ? `${query}&` : '';
  const resposta = await pedidoFetch(`${url}/rest/v1/${tabela}?${parametros}select=id&limit=1`, {
    method: 'HEAD',
    headers: { ...cabecalhos(sessao?.access_token, anonKey), Prefer: 'count=exact' },
  });

  if (!resposta.ok) {
    throw new Error(`Não foi possível contar os registos em "${tabela}" (${resposta.status}).`);
  }

  const intervalo = resposta.headers.get('content-range') || '';
  const total = Number(String(intervalo).split('/')[1]);
  return Number.isFinite(total) ? total : 0;
}

export async function enviarComprovativo(ficheiro, caminho) {
  const { url, anonKey } = config();
  const sessao = await sessaoValida();
  const resposta = await pedidoFetch(`${url}/storage/v1/object/${BUCKET_COMPROVATIVOS}/${caminho}`, {
    method: 'POST',
    headers: {
      ...cabecalhos(sessao?.access_token, anonKey),
      'Content-Type': ficheiro.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: ficheiro,
  });
  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Não foi possível carregar o comprovativo. ${texto.slice(0, 160)}`);
  }
  return caminho;
}

export async function linkComprovativo(caminho, segundos = 3600) {
  if (!caminho) return null;
  const { url, anonKey } = config();
  const sessao = await sessaoValida();
  const resposta = await pedidoFetch(`${url}/storage/v1/object/sign/${BUCKET_COMPROVATIVOS}/${caminho}`, {
    method: 'POST',
    headers: { ...cabecalhos(sessao?.access_token, anonKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: segundos }),
  });
  if (!resposta.ok) return null;
  const dados = await resposta.json().catch(() => ({}));
  if (!dados?.signedURL) return null;
  return `${url}/storage/v1${dados.signedURL}`;
}

export const BUCKET_PERFIS = 'perfis';

export async function enviarFoto(ficheiro, caminho) {
  const { url, anonKey } = config();
  const sessao = await sessaoValida();
  const resposta = await pedidoFetch(`${url}/storage/v1/object/${BUCKET_PERFIS}/${caminho}`, {
    method: 'POST',
    headers: {
      ...cabecalhos(sessao?.access_token, anonKey),
      'Content-Type': ficheiro.type || 'image/jpeg',
      'x-upsert': 'true',
    },
    body: ficheiro,
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(
      `Não foi possível guardar a fotografia. ${texto.slice(0, 120) || 'Confirma o script das fotografias no Supabase.'}`,
    );
  }

  return `${url}/storage/v1/object/public/${BUCKET_PERFIS}/${caminho}`;
}

export async function definirFoto(fotoUrl) {
  try {
    await chamarFuncao('quotamob_definir_foto', { p_url: fotoUrl });
  } catch (falha) {
    if (falha.message === SEM_SCRIPT) {
      throw new Error(
        'Falta ativar as fotografias de perfil. Em Configurações, copia o script das fotografias para o Supabase.',
      );
    }
    throw falha;
  }
  return true;
}