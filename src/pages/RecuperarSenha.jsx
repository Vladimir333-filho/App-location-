import { useState } from 'react';
import SEO from '@/components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Smartphone,
  User,
} from 'lucide-react';
import { reporSenhaAutomatica } from '@/lib/supabaseClient';
import { formatarTelefone } from '@/lib/format';

export default function RecuperarSenha() {
  <SEO title="QuotaMob | Recuperar palavra-passe" description="Recupere o acesso à sua conta QuotaMob e siga as instruções para voltar a entrar na plataforma." />
  const navigate = useNavigate();
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [nova, setNova] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [feita, setFeita] = useState('');
  const [copiada, setCopiada] = useState(false);

  const numero = telefone.replace(/\D/g, '');

  async function submeter(evento) {
    evento.preventDefault();
    setErro('');

    if (numero.length !== 9) {
      setErro('Escreve os 9 dígitos do teu número de telefone.');
      return;
    }
    if (nome.trim().length < 3) {
      setErro('Escreve o teu nome como está no registo.');
      return;
    }
    if (nova.length < 6) {
      setErro('A nova palavra-passe precisa de pelo menos 6 caracteres.');
      return;
    }
    if (nova !== repetir) {
      setErro('As duas palavras-passe não são iguais.');
      return;
    }

    setAEnviar(true);
    try {
      await reporSenhaAutomatica({ telefone: numero, nome: nome.trim(), palavraPasse: nova });
      setFeita(nova);
    } catch (falha) {
      setErro(falha.message || 'Não foi possível repor a palavra-passe.');
    } finally {
      setAEnviar(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(feita);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 1800);
    } catch {
      setErro('Não foi possível copiar. Aponta a palavra-passe.');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="relative overflow-hidden bg-primary px-6 pb-16 pt-10 text-primary-foreground">
          <button
            onClick={() => navigate('/')}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/85"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </button>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Recuperar palavra-passe</h1>
          <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-white/70">
            É automático: escolhes a nova palavra-passe e ela fica logo ativa.
          </p>
        </header>

        <main className="-mt-10 flex-1 px-5 pb-10">
          <div className="animar-surgir rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(11,37,69,0.55)] ring-1 ring-border/60">
            {feita ? (
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h2 className="mt-3 font-heading text-lg font-bold text-foreground">Palavra-passe ativada</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  O sistema ativou a palavra-passe nova para <strong className="font-semibold text-foreground">
                    +244 {formatarTelefone(numero)}
                  </strong>. Guarda-a agora — é esta que vais usar para entrar.
                </p>

                <div className="mt-4 rounded-2xl bg-muted/70 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">A tua palavra-passe</p>
                  <p className="mt-1 break-all font-mono text-lg font-bold text-foreground">{feita}</p>
                  <button
                    onClick={copiar}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-primary ring-1 ring-border"
                  >
                    {copiada ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiada ? 'Copiada' : 'Copiar'}
                  </button>
                </div>

                <button
                  onClick={() => navigate('/')}
                  className="mt-4 h-[52px] w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground"
                >
                  Entrar agora
                </button>
              </div>
            ) : (
              <form onSubmit={submeter} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Número de telefone
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                    <span className="text-sm font-semibold text-muted-foreground">+244</span>
                    <span className="h-6 w-px bg-border" />
                    <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      value={telefone}
                      onChange={(e) => {
                        setTelefone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11));
                        setErro('');
                      }}
                      inputMode="numeric"
                      placeholder="9XX XXX XXX"
                      className="h-14 w-full bg-transparent text-base font-medium tracking-wide outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nome como está no registo
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      value={nome}
                      onChange={(e) => {
                        setNome(e.target.value);
                        setErro('');
                      }}
                      autoComplete="name"
                      placeholder="João Manuel"
                      className="h-14 w-full bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nova palavra-passe
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      value={nova}
                      onChange={(e) => {
                        setNova(e.target.value);
                        setErro('');
                      }}
                      type={ver ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                    />
                    <button
                      type="button"
                      onClick={() => setVer((v) => !v)}
                      className="p-1 text-muted-foreground"
                      aria-label="Mostrar palavra-passe"
                    >
                      {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Confirmar palavra-passe
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      value={repetir}
                      onChange={(e) => {
                        setRepetir(e.target.value);
                        setErro('');
                      }}
                      type={ver ? 'text' : 'password'}
                      placeholder="Repetir a palavra-passe"
                      className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                    />
                  </div>
                </div>

                {erro && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700">{erro}</p>}

                <button
                  type="submit"
                  disabled={aEnviar}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
                >
                  {aEnviar && <Loader2 className="h-5 w-5 animate-spin" />}
                  {aEnviar ? 'A ativar…' : 'Ativar nova palavra-passe'}
                </button>

                <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
                  É tudo automático — não precisas de contactar o tesoureiro.
                </p>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Já tens a palavra-passe?{' '}
            <Link to="/" className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">
              Entrar
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}