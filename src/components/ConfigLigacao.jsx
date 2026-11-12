import { useState } from 'react';
import { Database, X } from 'lucide-react';
import { getLigacao, guardarLigacao } from '@/lib/supabaseConfig';

export default function ConfigLigacao({ aberto, aoFechar, obrigatorio = false }) {
  const atual = getLigacao();
  const [url, setUrl] = useState(atual.url);
  const [chave, setChave] = useState(atual.anonKey);
  const [erro, setErro] = useState('');

  if (!aberto) return null;

  function gravar() {
    setErro('');
    if (!/^https?:\/\//.test(url.trim())) {
      setErro('Escreve o endereço do projeto, começando por https://');
      return;
    }
    if (chave.trim().length < 20) {
      setErro('A chave pública (anon key) parece incompleta.');
      return;
    }
    guardarLigacao(url, chave);
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="animar-surgir w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-primary">Ligar base de dados</h2>
              <p className="text-xs text-muted-foreground">Projeto Supabase da empresa</p>
            </div>
          </div>
          {!obrigatorio && (
            <button onClick={aoFechar} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Endereço do projeto
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://xxxxx.supabase.co"
          autoCapitalize="none"
          autoCorrect="off"
          className="mb-4 h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm outline-none focus:border-primary"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Chave pública (anon key)
        </label>
        <textarea
          value={chave}
          onChange={(e) => setChave(e.target.value)}
          rows={3}
          placeholder="eyJhbGciOi..."
          autoCapitalize="none"
          autoCorrect="off"
          className="mb-2 w-full rounded-2xl border border-input bg-white p-4 text-xs outline-none focus:border-primary"
        />
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          Usa apenas a chave pública. Nunca coloques aqui a chave <span className="font-semibold">service_role</span>.
        </p>

        {erro && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        <button
          onClick={gravar}
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition active:scale-[0.99]"
        >
          Ligar e continuar
        </button>
      </div>
    </div>
  );
}