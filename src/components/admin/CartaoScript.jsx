import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CartaoScript({ icone: Icone, titulo, texto, script, destino }) {
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  async function copiar() {
    setErro('');
    try {
      await navigator.clipboard.writeText(script);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro('Não foi possível copiar automaticamente. Tenta abrir no computador.');
    }
  }

  return (
    <div className="card-suave space-y-3 p-4">
      <div className="flex items-center gap-2 text-primary">
        {Icone && <Icone className="h-4 w-4" />}
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]">{titulo}</p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{texto}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={copiar}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-bold text-primary-foreground"
        >
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? 'Script copiado' : 'Copiar script'}
        </button>
        <a
          href={destino}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center rounded-2xl bg-muted text-xs font-bold text-foreground"
        >
          Abrir Supabase
        </a>
      </div>
      {erro && <p className="text-xs leading-snug text-red-700">{erro}</p>}
    </div>
  );
}