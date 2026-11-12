const CHAVE = 'quotamob.ligacao';

const INTEGRADA = {
  url: 'https://vwcuzpvwzzgnyendjboq.supabase.co',
  anonKey: 'sb_publishable_R8H_V0oTHmJTJ1MF7TbqKg_8YfnhEil',
};

export function getLigacao() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const dados = JSON.parse(bruto);
      if (dados?.url && dados?.anonKey) return { url: dados.url, anonKey: dados.anonKey };
    }
  } catch {
    /* usa a ligação integrada */
  }
  return INTEGRADA;
}

export function guardarLigacao(url, anonKey) {
  const limpo = {
    url: String(url || '').trim().replace(/\/+$/, ''),
    anonKey: String(anonKey || '').trim(),
  };
  localStorage.setItem(CHAVE, JSON.stringify(limpo));
  return limpo;
}

export function limparLigacao() {
  localStorage.removeItem(CHAVE);
}

export function ligacaoConfigurada() {
  const { url, anonKey } = getLigacao();
  return Boolean(url && anonKey);
}