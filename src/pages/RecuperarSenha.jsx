import { useState } from 'react';
import SEO from '@/components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2,
  Lock, Smartphone,
} from 'lucide-react';
import {
  solicitarOtpRecuperacao,
  confirmarOtpRecuperacao,
} from '@/lib/supabaseClient';
import { formatarTelefone } from '@/lib/format';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [otpId, setOtpId] = useState('');
  const [codigoTeste, setCodigoTeste] = useState('');
  const [nova, setNova] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [etapa, setEtapa] = useState('telefone');
  const [concluida, setConcluida] = useState(false);
  const [modoTeste, setModoTeste] = useState(false);

  const numero = telefone.replace(/\D/g, '');

  async function pedirCodigo(evento) {
    evento.preventDefault();
    setErro('');
    if (!/^9\d{8}$/.test(numero)) {
      setErro('Escreve os 9 dígitos do teu número de telefone.');
      return;
    }
    setAEnviar(true);
    try {
      const resultado = await solicitarOtpRecuperacao(numero);
      setOtpId(resultado.otp_id || '');
      setCodigoTeste(resultado.test_code || '');
      setEtapa('codigo');
    } catch (falha) {
      setErro(falha.message || 'Não foi possível pedir o código. Tenta novamente.');
    } finally {
      setAEnviar(false);
    }
  }

  async function confirmarCodigo(evento) {
    evento.preventDefault();
    setErro('');
    if (!/^\d{6}$/.test(codigo)) {
      setErro('Introduz o código de 6 dígitos.');
      return;
    }
    if (!otpId) {
      setErro('Não foi possível identificar o pedido de código. Solicita um novo código.');
      return;
    }
    if (nova.length < 8) {
      setErro('A nova palavra-passe precisa de pelo menos 8 caracteres.');
      return;
    }
    if (nova.length > 72) {
      setErro('A palavra-passe não pode ultrapassar 72 caracteres.');
      return;
    }
    if (nova !== repetir) {
      setErro('As duas palavras-passe não são iguais.');
      return;
    }

    setAEnviar(true);
    try {
      const resultado = await confirmarOtpRecuperacao({
        telefone: numero,
        otpId,
        codigo,
        novaPalavraPasse: nova,
      });
      setModoTeste(resultado.test_mode === true);
      setNova('');
      setRepetir('');
      setCodigo('');
      setCodigoTeste('');
      setConcluida(true);
    } catch (falha) {
      setErro(falha.message || 'Não foi possível confirmar o código.');
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="QuotaMob | Recuperar palavra-passe" description="Recupere o acesso à sua conta QuotaMob através de um código de verificação." />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="relative overflow-hidden bg-primary px-6 pb-16 pt-10 text-primary-foreground">
          <button
            onClick={() => etapa === 'codigo' ? setEtapa('telefone') : navigate('/')}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/85"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </button>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Recuperar palavra-passe</h1>
          <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-white/70">
            Confirma o teu número através de um código SMS para criares uma nova palavra-passe.
          </p>
        </header>

        <main className="-mt-10 flex-1 px-5 pb-10">
          <div className="animar-surgir rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(11,37,69,0.55)] ring-1 ring-border/60">
            {concluida ? (
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h2 className="mt-3 font-heading text-lg font-bold text-foreground">{modoTeste ? "Código de teste confirmado" : "Palavra-passe actualizada"}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {modoTeste ? <>O código Sandbox foi aceite para <strong className="font-semibold text-foreground">+244 {formatarTelefone(numero)}</strong>. A palavra-passe real não foi alterada. Este teste confirma apenas a integração OTP.</> : <>A palavra-passe da conta associada a <strong className="font-semibold text-foreground">+244 {formatarTelefone(numero)}</strong> foi actualizada. Já podes entrar com a nova palavra-passe.</>}
                </p>
                <button onClick={() => navigate('/')} className="mt-4 h-[52px] w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
                  {modoTeste ? "Voltar ao início" : "Entrar agora"}
                </button>
              </div>
            ) : etapa === 'telefone' ? (
              <form onSubmit={pedirCodigo} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Número de telefone</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                    <span className="text-sm font-semibold text-muted-foreground">+244</span>
                    <span className="h-6 w-px bg-border" />
                    <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      value={telefone}
                      onChange={(e) => { setTelefone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11)); setErro(''); }}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="9XX XXX XXX"
                      className="h-14 w-full bg-transparent text-base font-medium tracking-wide outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                    />
                  </div>
                </div>
                {erro && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700">{erro}</p>}
                <button type="submit" disabled={aEnviar} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60">
                  {aEnviar && <Loader2 className="h-5 w-5 animate-spin" />}
                  {aEnviar ? 'A solicitar código…' : 'Enviar código SMS'}
                </button>
                <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">Enviaremos um código de verificação para o número indicado, se estiver associado a uma conta activa.</p>
              </form>
            ) : (
              <form onSubmit={confirmarCodigo} className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Introduz o código enviado para <strong className="text-foreground">+244 {formatarTelefone(numero)}</strong>.
                </p>
                {codigoTeste && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                    Código de teste Sandbox: <strong className="font-mono">{codigoTeste}</strong>
                  </p>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Código de verificação</label>
                  <input value={codigo} onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6)); setErro(''); }} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="h-14 w-full rounded-2xl border border-input bg-white px-4 text-center font-mono text-xl font-bold tracking-[0.4em] outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova palavra-passe</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input value={nova} onChange={(e) => { setNova(e.target.value); setErro(''); }} type={ver ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres" className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70" />
                    <button type="button" onClick={() => setVer((v) => !v)} className="p-1 text-muted-foreground" aria-label="Mostrar palavra-passe">
                      {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirmar palavra-passe</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-input bg-white px-4 focus-within:border-primary">
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input value={repetir} onChange={(e) => { setRepetir(e.target.value); setErro(''); }} type={ver ? 'text' : 'password'} autoComplete="new-password" placeholder="Repetir a palavra-passe" className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70" />
                  </div>
                </div>
                {erro && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700">{erro}</p>}
                <button type="submit" disabled={aEnviar} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60">
                  {aEnviar && <Loader2 className="h-5 w-5 animate-spin" />}
                  {aEnviar ? 'A confirmar…' : 'Confirmar código e actualizar'}
                </button>
                <button type="button" onClick={() => { setEtapa('telefone'); setCodigo(''); setOtpId(''); setCodigoTeste(''); setErro(''); }} className="w-full py-2 text-xs font-semibold text-primary">
                  Usar outro número
                </button>
                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">O código expira em 5 minutos. Nunca o partilhes com ninguém.</p>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Já tens a palavra-passe?{' '}
            <Link to="/" className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">Entrar</Link>
          </p>
        </main>
      </div>
    </div>
  );
}