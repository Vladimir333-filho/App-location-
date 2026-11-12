import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatKz, textoVencimento } from '@/lib/format';

export default function AlertaAtraso({ quotas = [] }) {
  const atrasadas = quotas.filter((quota) => quota.estado === 'atrasada');
  if (atrasadas.length === 0) return null;

  const total = atrasadas.reduce((soma, quota) => soma + quota.valor, 0);
  const maisAntiga = [...atrasadas].sort((a, b) =>
    String(a.vencimento || '').localeCompare(String(b.vencimento || '')),
  )[0];

  return (
    <Link
      to={`/quotas/${maisAntiga.id}/pagar`}
      className="animar-surgir flex items-center gap-3 rounded-3xl bg-red-50 p-4 ring-1 ring-red-100"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-700">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-bold text-red-800">
          {atrasadas.length === 1 ? 'Tens 1 quota em atraso' : `Tens ${atrasadas.length} quotas em atraso`}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-red-700/90">
          {formatKz(total)} por pagar · {textoVencimento(maisAntiga.vencimento)}
        </p>
      </div>
      <span className="shrink-0 text-xs font-bold text-red-700">Pagar</span>
    </Link>
  );
}