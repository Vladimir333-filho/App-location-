import { useEffect, useState } from 'react';
import SEO from '@/components/SEO';
import { ShieldCheck, Smartphone, KeyRound, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { listarFatoresMfa, iniciarRegistoTotp, confirmarRegistoTotp, removerFatorTotp } from '@/lib/mfa';

export default function Seguranca() {
  const [fatores, setFatores] = useState([]);
  const [registo, setRegisto] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);
  const [aProcessar, setAProcessar] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function carregar() {
    setErro('');
    try {
      const lista = await listarFatoresMfa();
      setFatores(lista.filter((f) => f.factor_type === 'totp'));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setACarregar(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function iniciar() {
    setErro('');
    setMensagem('');
    setAProcessar(true);
    try {
      const dados = await iniciarRegistoTotp('QuotaMob');
      setRegisto({ id: dados.id, qr: dados.totp?.qr_code, segredo: dados.totp?.secret, uri: dados.totp?.uri });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAProcessar(false);
    }
  }

  async function confirmar() {
    setErro('');
    if (!/^\\d{6}$/.test(codigo)) {
      setErro('Introduz o código de 6 dígitos apresentado no autenticador.');
      return;
    }
    setAProcessar(true);
    try {
      await confirmarRegistoTotp(registo.id, codigo);
      setRegisto(null);
      setCodigo('');
      setMensagem('Google Authenticator activado. No próximo início de sessão será pedido o código.');
      await carregar();
    } catch (falha) {
      setErro(falha.message || 'Código inválido. Confirma a hora do telemóvel e tenta novamente.');
    } finally {
      setAProcessar(false);
    }
  }

  async function desactivar(fator) {
    if (!window.confirm('Queres mesmo desactivar a verificação em duas etapas neste dispositivo?')) return;
    setErro('');
    setAProcessar(true);
    try {
      await removerFatorTotp(fator.id);
      setMensagem('Autenticação de dois factores desactivada.');
      await carregar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAProcessar(false);
    }
  }

  const activo = fatores.some((f) => f.status === 'verified');

  return (
    <div className="space-y-4">
      <SEO title="QuotaMob | Segurança da conta" description="Configure a verificação em duas etapas da sua conta QuotaMob." />
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Segurança da conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Protege o acesso com um código temporário do Google Authenticator.</p>
      </div>

      <div className="card-suave space-y-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">Verificação em duas etapas</p>
            <p className="text-xs text-muted-foreground">{aCarregar ? 'A verificar estado…' : activo ? 'Protecção activa' : 'Opcional — ainda não activada'}</p>
          </div>
          {activo && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        </div>

        {erro && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">{erro}</p>}
        {mensagem && <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800">{mensagem}</p>}

        {aCarregar ? <div className="flex justify-center py-5"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : (
          <>
            {activo ? (
              <>
                <p className="text-xs leading-relaxed text-muted-foreground">A tua conta pede um código do autenticador depois da palavra-passe. Guarda o acesso ao autenticador num local seguro.</p>
                <button onClick={() => desactivar(fatores.find((f) => f.status === 'verified'))} disabled={aProcessar} className="h-12 w-full rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-red-700 disabled:opacity-60">Desactivar verificação em duas etapas</button>
              </>
            ) : !registo ? (
              <>
                <p className="text-xs leading-relaxed text-muted-foreground">Instala o Google Authenticator no telemóvel. Depois activa a protecção e confirma o primeiro código para concluir a configuração.</p>
                <button onClick={iniciar} disabled={aProcessar} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
                  {aProcessar && <Loader2 className="h-4 w-4 animate-spin" />}<Smartphone className="h-4 w-4" /> Configurar Google Authenticator
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">1. Adiciona a conta no Google Authenticator</p>
                {registo.qr && <div className="flex justify-center rounded-2xl bg-white p-3"><img src={registo.qr} alt="Código QR para configurar o Google Authenticator" className="h-48 w-48 object-contain" /></div>}
                <p className="text-xs text-muted-foreground">Se não conseguires ler o QR, introduz manualmente esta chave no autenticador:</p>
                <div className="break-all rounded-xl bg-muted p-3 font-mono text-xs font-bold text-foreground">{registo.segredo}</div>
                <p className="text-sm font-semibold text-foreground">2. Introduz o código de 6 dígitos</p>
                <input value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="h-14 w-full rounded-2xl border border-input px-4 text-center font-mono text-2xl font-bold tracking-[0.4em] outline-none focus:border-primary" />
                <button onClick={confirmar} disabled={aProcessar} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">{aProcessar && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar e activar</button>
                <button onClick={() => { setRegisto(null); setCodigo(''); }} className="h-10 w-full text-xs font-semibold text-muted-foreground">Cancelar configuração</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 rounded-2xl bg-amber-50 p-3 text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-[11px] leading-relaxed">Se perderes o telemóvel ou o acesso ao autenticador, contacta a administração para validar a tua identidade e recuperar o acesso. Não partilhes os códigos com ninguém.</p>
      </div>
    </div>
  );
}
