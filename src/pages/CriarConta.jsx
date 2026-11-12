import { useState } from 'react';
import SEO from '@/components/SEO';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Smartphone, User, UserPlus } from 'lucide-react';
import { ehAdmin, useSessao } from '@/lib/sessao';
import { registarConta } from '@/lib/supabaseClient';

export default function CriarConta() {
  const { estado, perfil } = useSessao();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [palavraPasse, setPalavraPasse] = useState('');
  const [verChave, setVerChave] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [jaExiste, setJaExiste] = useState(false);

  if (estado === 'pronto' && perfil) {
    return <Navigate to={ehAdmin(perfil) ? '/admin' : '/quotas'} replace />;
  }

  async function submeter(evento) {
    evento.preventDefault();
    setErro('');
    setJaExiste(false);

    const numero = telefone.replace(/\D/g, '');
    if (nome.trim().length < 3) {
      setErro('Escreve o teu nome completo.');
      return;
    }
    if (numero.length !== 9) {
      setErro('Escreve os 9 dígitos do teu número de telefone.');
      return;
    }
    if (palavraPasse.length < 8) {
      setErro('A palavra-passe deve ter pelo menos 8 caracteres.');
      return;
    }

    setAEnviar(true);
    setAviso('');
    try {
      // O Supabase cria o perfil na tabela "motoristas" através do trigger.
      const { sessao } = await registarConta(numero, palavraPasse, nome);
      if (sessao) {
        navigate('/quotas', { replace: true });
        return;
      }
      setAviso('Conta criada. Entra com o teu número e palavra-passe.');
      setAEnviar(false);
      setTimeout(() => navigate('/', { replace: true }), 1800);
    } catch (falha) {
      if (falha.jaExiste) {
        setJaExiste(true);
        setErro('Este número já tem uma conta. Não cries outra conta. Pede ao tesoureiro para verificar a identidade e recuperar o perfil existente.');
        setAEnviar(false);
        return;
      }
      setJaExiste(false);
      setErro(falha.message || 'Não foi possível criar a conta. Tenta outra vez.');
      setAEnviar(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="relative overflow-hidden bg-primary px-6 pb-16 pt-12 text-primary-foreground">
          <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/5" />
          <button
            onClick={() => navigate('/')}
            className="relative mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/70"
          >
            ← Voltar
          </button>
          <h1 className="relative font-heading text-3xl font-extrabold tracking-tight">Criar conta</h1>
          <p className="relative mt-2 max-w-[17rem] text-sm leading-relaxed text-white/70">
            Regista-te como motorista para veres e pagares as tuas quotas semanais.
          </p>
        </header>

        <main className="-mt-10 flex-1 px-5 pb-10">
          <div className="animar-surgir rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(11,37,69,0.55)] ring-1 ring-border/60">
            <form onSubmit={submeter} className="space-y-4">
              <SEO title="QuotaMob | Criar conta de motorista" description="Crie ou active a sua conta QuotaMob para acompanhar as quotas semanais e submeter comprovativos de pagamento." />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nome completo
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                    placeholder="João Manuel"
                    className="h-14 w-full bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>

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
                    autoComplete="tel"
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
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
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

              {erro && (
                <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700">{erro}</p>
              )}

              {aviso && (
                <p className="rounded-xl bg-success/10 px-3 py-2.5 text-sm leading-snug text-success">{aviso}</p>
              )}

              {jaExiste && (
                <button
                  type="button"
                  onClick={() => navigate('/recuperar-senha')}
                  className="h-12 w-full rounded-2xl bg-primary/10 text-sm font-bold text-primary"
                >
                  Recuperar palavra-passe
                </button>
              )}

              <button
                type="submit"
                disabled={aEnviar}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
              >
                {aEnviar ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                {aEnviar ? 'A criar conta…' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-5 border-t border-border/70 pt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Já tens conta?{' '}
              <button
                onClick={() => navigate('/')}
                className="font-semibold text-primary underline decoration-primary/30 underline-offset-4"
              >
                Entrar
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
