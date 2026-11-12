const ESTADOS = {
  pendente: { rotulo: 'Pendente', classe: 'bg-amber-100 text-amber-900 ring-amber-200', ponto: 'bg-amber-500' },
  em_analise: { rotulo: 'Em análise', classe: 'bg-sky-100 text-sky-900 ring-sky-200', ponto: 'bg-sky-500' },
  paga: { rotulo: 'Paga', classe: 'bg-emerald-100 text-emerald-900 ring-emerald-200', ponto: 'bg-emerald-500' },
  atrasada: { rotulo: 'Atrasada', classe: 'bg-red-100 text-red-800 ring-red-200', ponto: 'bg-red-500' },
  aprovado: { rotulo: 'Aprovado', classe: 'bg-emerald-100 text-emerald-900 ring-emerald-200', ponto: 'bg-emerald-500' },
  rejeitado: { rotulo: 'Rejeitado', classe: 'bg-red-100 text-red-800 ring-red-200', ponto: 'bg-red-500' },
};

export default function EstadoBadge({ estado, className = '' }) {
  const info = ESTADOS[estado] || ESTADOS.pendente;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${info.classe} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${info.ponto}`} />
      {info.rotulo}
    </span>
  );
}

export function corDaBarra(estado) {
  if (estado === 'paga' || estado === 'aprovado') return 'bg-emerald-500';
  if (estado === 'em_analise') return 'bg-sky-500';
  if (estado === 'atrasada' || estado === 'rejeitado') return 'bg-red-500';
  return 'bg-amber-400';
}