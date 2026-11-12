import { useState } from 'react';
import SEO from '@/components/SEO';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, Smartphone, UserPlus } from 'lucide-react';
import { useSessao, ehAdmin } from '@/lib/sessao';
import { ligacaoConfigurada } from '@/lib/supabaseConfig';
import ConfigLigacao from '@/components/ConfigLigacao';

export default function Entrar() {
  <SEO title="QuotaMob | Entrar na conta" description="Aceda à sua conta QuotaMob para consultar quotas semanais, pagamentos e informações da sua organização." />
  const { estado, perfil, entrar, erroPerfil } = useSessao();
  const navigate = useNavigate();
  const [telefone, setTelefone] = useState('');
  const [palavraPasse, setPalavraPasse] = useState('');
  const [verChave, setVerChave] = useState(false);
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [configAberta, setConfigAberta] = useState(!ligacaoConfigurada());

  if (estado === 'pronto' && perfil) {
    return <Navigate to={ehAdmin(perfil) ? '/admin' : '/quotas'} replace />;
  }

  async function submeter(evento) {
    evento.preventDefault();
    setErro('');
    const numero = telefone.replace(/\D/g, '');
    if (numero.length !== 9) {
      setErro('Escreve os 9 dígitos do teu número de telefone.');
      return;
    }
    if (palavraPasse.length < 4) {
      setErro('A palavra-passe deve ter pelo menos 4 caracteres.');
      return;
    }
    setAEnviar(true);
    try {
      await entrar(numero, palavraPasse);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAEnviar(false);
    }
  }

  const semPerfil = estado === 'pronto' && !perfil;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="relative overflow-hidden bg-primary px-6 pb-20 pt-16 text-primary-foreground">
          <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -left-10 bottom-2 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
              <ShieldCheck className="h-3.5 w-3.5" /> Quotas sem dinheiro vivo
            </span>
            <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight">QuotaMob</h1>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-white/70">
              Entra com o teu número e paga a quota da semana pelo Multicaixa Express.
            </p>
          </div>
        </header>

        <main className="-mt-12 flex-1 px-5 pb-10">
          <div className="animar-surgir rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(11,37,69,0.55)] ring-1 ring-border/60">
            <h2 className="font-heading text-xl font-bold text-foreground">Entrar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Número de telefone e palavra-passe.</p>

            <form onSubmit={submeter} className="mt-6 space-y-4">
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
                    onChange={(e) => setTelefone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11))}
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="9XX XXX XXX"
                    className="h-14 w-full bg-transparent text-base font-medium tracking-wide outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Palavra-passe
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={palavraPasse}
                    onChange={(e) => setPalavraPasse(e.target.value)}
                    type={verChave ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="button"
                    onClick={() => setVerChave((v) => !v)}
                    className="p-1 text-muted-foreground"
                    aria-label={verChave ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
                  >
                    {verChave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {(erro || semPerfil) && (
                <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700">
                  {erro ||
                    'A tua conta ainda não tem perfil de motorista. Usa "Criar conta" com o mesmo número ou fala com o tesoureiro.'}
                </p>
              )}

              <button
                type="submit"
                disabled={aEnviar}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
              >
                {aEnviar && <Loader2 className="h-5 w-5 animate-spin" />}
                {aEnviar ? 'A entrar…' : 'Entrar'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => navigate('/recuperar-senha')}
              className="mt-3 w-full text-center text-xs font-semibold text-primary underline decoration-primary/30 underline-offset-4"
            >
              Esqueci-me da palavra-passe
            </button>

            <div className="mt-5 border-t border-border/70 pt-4">
              <p className="text-center text-xs leading-relaxed text-muted-foreground">Ainda não tens conta?</p>
              <button
                type="button"
                onClick={() => navigate('/criar-conta')}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/15 bg-secondary text-sm font-bold text-primary transition active:scale-[0.99]"
              >
                <UserPlus className="h-4 w-4" /> Criar conta de motorista
              </button>
            </div>
          </div>

          {!ligacaoConfigurada() && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setConfigAberta(true)}
                className="text-xs font-semibold text-primary underline decoration-primary/30 underline-offset-4"
              >
                Ligar base de dados
              </button>
            </div>
          )}
          {erroPerfil && ligacaoConfigurada() && (
            <p className="mt-3 break-words px-2 text-center text-[11px] text-red-600">{erroPerfil}</p>
          )}
        </main>
      </div>

      <ConfigLigacao aberto={configAberta} aoFechar={() => setConfigAberta(false)} />
    </div>
  );
}