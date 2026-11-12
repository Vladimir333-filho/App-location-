export function formatKz(valor) {
  const numero = Number(valor ?? 0);
  const seguro = Number.isFinite(numero) ? Math.round(numero) : 0;
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(seguro)} Kz`;
}

export function formatKzCurto(valor) {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return '0 Kz';
  if (Math.abs(numero) >= 1000000) return `${(numero / 1000000).toFixed(1).replace('.', ',')} M Kz`;
  return formatKz(numero);
}

export function formatData(data) {
  if (!data) return '—';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '—';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
}

export function formatDataHora(data) {
  if (!data) return '—';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatData(data)} · ${hh}h${mm}`;
}

export function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function diasParaVencer(vencimento) {
  if (!vencimento) return null;
  const alvo = new Date(`${String(vencimento).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

export function textoVencimento(vencimento) {
  const dias = diasParaVencer(vencimento);
  if (dias === null) return 'Sem data';
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return 'Vence amanhã';
  if (dias > 1) return `Vence em ${dias} dias`;
  if (dias === -1) return 'Venceu ontem';
  return `Venceu há ${Math.abs(dias)} dias`;
}

export function limparTelefone(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

export function formatarTelefone(valor) {
  const n = limparTelefone(valor);
  if (n.length === 9) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  return n || '—';
}