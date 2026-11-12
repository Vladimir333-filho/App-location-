import { useMemo, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { formatKz } from '@/lib/format';

export default function QuotasGeradas({ quotas, quotasComPagamento, aoEliminar }) {
  const [confirmar, setConfirmar] = useState(null);
  const [aEliminar, setAEliminar] = useState(false);
  const [erro, setErro] = useState('');

  const grupos = useMemo(() => {
    const mapa = {};
    quotas.forEach((quota) => {
      const chave = quota.referencia || 'Sem referência';
      if (!mapa[chave]) mapa[chave] = { referencia: chave, ids: [], valor: quota.valor, pagas: 0 };
      mapa[chave].ids.push(quota.id);
      if (quotasComPagamento.has(quota.id)) mapa[chave].pagas += 1;
    });
    return Object.values(mapa);
  }, [quotas, quotasComPagamento]);

  async function eliminar() {
    setErro('');
    setAEliminar(true);
    try {
      await aoEliminar(confirmar.ids);
      setConfirmar(null);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAEliminar(false);
    }
  }

  if (grupos.length === 0) return null;

  return (
    <section className="space-y-2">
      <div>
        <h2 className="font-heading text-base font-bold text-foreground">Quotas geradas</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Elimina uma quota gerada por engano.</p>
      </div>

      {grupos.map((grupo) => (
        <div key={grupo.referencia} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-border/70">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{grupo.referencia}</p>
            <p className="text-[11px] text-muted-foreground">
              {grupo.ids.length} quotas · {formatKz(grupo.valor)}
              {grupo.pagas > 0 ? ` · ${grupo.pagas} com comprovativo` : ''}
            </p>
          </div>
          <button
            onClick={() => {
              setErro('');
              setConfirmar(grupo);
            }}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 text-[11px] font-bold text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      ))}

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-4 backdrop-blur-sm">
          <div className="animar-surgir w-full max-w-md rounded-3xl bg-white p-5">
            <h2 className="font-heading text-lg font-bold text-foreground">Eliminar quotas?</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Vão ser apagadas as <span className="font-semibold text-foreground">{confirmar.ids.length} quotas</span> de{' '}
              <span className="font-semibold text-foreground">{confirmar.referencia}</span>. Esta acção não se pode desfazer.
            </p>

            {confirmar.pagas > 0 && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-800">
                Os {confirmar.pagas} comprovativos enviados para estas quotas também vão ser apagados.
              </p>
            )}

            {erro && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{erro}</p>}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmar(null)}
                className="h-12 rounded-2xl bg-muted text-sm font-bold text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={eliminar}
                disabled={aEliminar}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-bold text-white disabled:opacity-60"
              >
                {aEliminar && <Loader2 className="h-4 w-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}