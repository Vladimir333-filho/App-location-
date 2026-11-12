import { Loader2, Inbox, AlertTriangle } from 'lucide-react';

export function Carregando({ texto = 'A carregar…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}

export function Vazio({ titulo, texto, icone: Icone = Inbox, acao }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white/60 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icone className="h-6 w-6" />
      </span>
      <p className="mt-4 font-heading text-base font-bold text-foreground">{titulo}</p>
      {texto && <p className="mt-1 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{texto}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function ErroCaixa({ mensagem, aoTentar }) {
  if (!mensagem) return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl bg-red-50 p-3.5 text-red-800 ring-1 ring-red-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm leading-snug">{mensagem}</p>
        {aoTentar && (
          <button onClick={aoTentar} className="mt-2 text-xs font-bold underline underline-offset-4">
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  );
}