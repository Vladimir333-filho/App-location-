const CHAVE = 'quotamob.pagamento';

const VAZIO = { numero: '', iban: '', titular: '', nota: '' };

export function lerDadosPagamento() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return { ...VAZIO };
    return { ...VAZIO, ...JSON.parse(bruto) };
  } catch {
    return { ...VAZIO };
  }
}

export function guardarDadosPagamento(dados) {
  localStorage.setItem(CHAVE, JSON.stringify({ ...VAZIO, ...dados }));
}