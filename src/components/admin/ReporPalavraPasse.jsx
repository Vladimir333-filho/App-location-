import { useState } from 'react';
import { Check, CheckCircle2, Copy, Eye, EyeOff, KeyRound, Loader2, X } from 'lucide-react';
import { formatarTelefone } from '@/lib/format';
import { reporPalavraPasse } from '@/lib/supabaseClient';

export default function ReporPalavraPasse({ motorista, aoFechar }) {
  const [nova, setNova] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState('');
  const [aGravar, setAGravar] = useState(false);
  const [feita, setFeita] = useState('');
  const [copiada, setCopiada] = useState(false);

  if (!motorista) return null;

  function fechar() {
    setNova('');
    setRepetir('');
    setErro('');
    setFeita('');
    setCopiada(false);
    aoFechar();
  }

  async function gravar() {
    setErro('');
    if (nova.length < 6) {
      setErro('A nova palavra-passe precisa de pelo menos 6 caracteres.');
      return;
    }
    if (nova !== repetir) {
      setErro('As duas palavras-passe novas não são iguais.');
      return;
    }
    setAGravar(true);
    try {
      await reporPalavraPasse(motorista.telefone, nova);
      setFeita(nova);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAGravar(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(feita);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 1800);
    } catch {
      setErro('Não foi possível copiar. Escreve a palavra-passe à mão.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-4 backdrop-blur-sm">
      <div className="animar-surgir max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">Repor palavra-passe</h2>
          </div>
          <button
            onClick={fechar}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {motorista.nome} · +244 {formatarTelefone(motorista.telefone)}
        </p>

        {feita ? (
          <>
            <div className="mt-4 flex flex-col items-center rounded-2xl bg-emerald-50 px-4 py-5 text-center ring-1 ring-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <p className="mt-2 font-heading text-sm font-bold text-emerald-900">Palavra-passe reposta</p>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-900">{feita}</p>
              <button
                onClick={copiar}
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200"
              >
                {copiada ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiada ? 'Copiada' : 'Copiar'}
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Dá esta palavra-passe ao motorista. Ele entra com o número +244 {formatarTelefone(motorista.telefone)}.
            </p>
            <button
              onClick={fechar}
              className="mt-4 h-12 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground"
            >
              Fechar
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Não é preciso saber a palavra-passe antiga. Escolhe a nova e passa-a ao motorista.
            </p>

            <Campo rotulo="Nova palavra-passe">
              <div className="flex items-center gap-2 rounded-2xl border border-input px-3 focus-within:border-primary">
                <input
                  type={ver ? 'text' : 'password'}
                  value={nova}
                  onChange={(e) => setNova(e.target.value)}
                  className="h-12 w-full bg-transparent text-sm outline-none"
                />
                <button onClick={() => setVer(!ver)} type="button" className="text-muted-foreground" aria-label="Ver">
                  {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Campo>

            <Campo rotulo="Repetir a nova">
              <input
                type={ver ? 'text' : 'password'}
                value={repetir}
                onChange={(e) => setRepetir(e.target.value)}
                className="h-12 w-full rounded-2xl border border-input px-3 text-sm outline-none focus:border-primary"
              />
            </Campo>

            {erro && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-snug text-red-700">{erro}</p>}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={fechar} className="h-12 rounded-2xl bg-muted text-sm font-bold text-foreground">
                Cancelar
              </button>
              <button
                onClick={gravar}
                disabled={aGravar}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {aGravar && <Loader2 className="h-4 w-4 animate-spin" />}
                Repor
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Campo({ rotulo, children }) {
  return (
    <label className="mb-3 mt-3 block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</span>
      {children}
    </label>
  );
}