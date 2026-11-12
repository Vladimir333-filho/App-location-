import { useNavigate } from 'react-router-dom';
import { ChevronRight, CalendarDays } from 'lucide-react';
import EstadoBadge, { corDaBarra } from '@/components/EstadoBadge';
import { formatKz, formatData, textoVencimento } from '@/lib/format';

export default function QuotaCard({ quota }) {
  const navigate = useNavigate();
  const podePagar = quota.estado !== 'paga';

  return (
    <button
      onClick={() => podePagar && navigate(`/quotas/${quota.id}/pagar`)}
      disabled={!podePagar}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-3xl bg-white p-4 text-left ring-1 ring-border/70 shadow-[0_14px_30px_-24px_rgba(11,37,69,0.6)] transition active:scale-[0.995] disabled:active:scale-100"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${corDaBarra(quota.estado)}`} />
      <div className="min-w-0 flex-1 pl-1.5">
        <div className="flex items-center gap-2">
          <p className="truncate font-heading text-base font-bold text-foreground">{quota.referencia}</p>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatData(quota.vencimento)} · {textoVencimento(quota.vencimento)}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <EstadoBadge estado={quota.estado} />
          <span className="font-heading text-base font-extrabold text-primary">{formatKz(quota.valor)}</span>
        </div>
      </div>
      {podePagar && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/60" />}
    </button>
  );
}