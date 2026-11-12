import { AlertTriangle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { diasParaVencer, formatKz, formatarTelefone } from '@/lib/format';

function linkCobranca(telefone, nome, referencia, valor, dias) {
  const numero = String(telefone || '').replace(/\D/g, '');
  if (!numero) return null;
  const destino = numero.length === 9 ? `244${numero}` : numero;
  const primeiro = String(nome || '').trim().split(/\s+/)[0] || '';
  const mensagem = `Olá ${primeiro}, a quota ${referencia} de ${formatKz(valor)} venceu há ${dias} dia(s). Podes pagar e enviar o comprovativo na app QuotaMob.`;
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensagem)}`;
}

export default function EmAtraso({ quotas = [], nomePorId = {} }) {
  const atrasadas = quotas
    .filter((quota) => quota.estado === 'atrasada')
    .sort((a, b) => String(a.vencimento || '').localeCompare(String(b.vencimento || '')));

  if (atrasadas.length === 0) return null;

  const total = atrasadas.reduce((soma, quota) => soma + quota.valor, 0);
  const visiveis = atrasadas.slice(0, 6);

  return (
    <section className="rounded-3xl bg-red-50 p-4 ring-1 ring-red-100">
      <div className="flex items-center gap-2 text-red-700">
        <AlertTriangle className="h-4 w-4" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Quotas vencidas</p>
      </div>
      <p className="mt-1 font-heading text-lg font-extrabold text-red-800">
        {atrasadas.length} quota(s) · {formatKz(total)}
      </p>
      <p className="text-xs leading-snug text-red-700/80">O prazo já passou. Envia o lembrete ao motorista.</p>

      <div className="mt-3 space-y-2">
        {visiveis.map((quota) => {
          const motorista = nomePorId[quota.motoristaId];
          const dias = Math.abs(diasParaVencer(quota.vencimento) ?? 0);
          const link = linkCobranca(motorista?.telefone, motorista?.nome, quota.referencia, quota.valor, dias);
          return (
            <div
              key={quota.id}
              className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{motorista?.nome || 'Motorista'}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {formatarTelefone(motorista?.telefone)} · há {dias} dia(s)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="font-heading text-sm font-extrabold text-red-700">{formatKz(quota.valor)}</p>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Enviar lembrete a ${motorista?.nome || 'motorista'}`}
                    className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {atrasadas.length > visiveis.length && (
        <Link
          to="/admin/quotas"
          className="mt-2 block text-center text-xs font-bold text-red-700 underline underline-offset-4"
        >
          +{atrasadas.length - visiveis.length} outra(s)
        </Link>
      )}
    </section>
  );
}