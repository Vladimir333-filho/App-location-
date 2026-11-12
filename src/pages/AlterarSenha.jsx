import { useState } from 'react';
import SEO from '@/components/SEO';
import { KeyRound, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useSessao, ehAdmin } from '@/lib/sessao';
import { alterarSenhaTemporaria } from '@/lib/supabaseClient';

export default function AlterarSenha() {
  const { perfil } = useSessao();
  const [nova, setNova] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function submeter(evento) {
    evento.preventDefault();
    setErro('');
    if (nova.length < 8) {
      setErro('A nova palavra-passe deve ter pelo menos 8 caracteres.');
      return;
    }
    if (nova !== repetir) {
      setErro('As duas palavras-passe não coincidem.');
      return;
    }
    setAGuardar(true);
    try {
      await alterarSenhaTemporaria(nova);
      window.location.assign(ehAdmin(perfil) ? '/admin' : '/quotas');
    } catch (falha) {
      setErro(falha.message || 'Não foi possível alterar a palavra-passe. Tenta novamente.');
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <SEO title="QuotaMob | Criar nova palavra-passe" description="Altere a palavra-passe temporária para continuar a utilizar o QuotaMob." />
      <main className="mx-auto mt-8 w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl ring-1 ring-border/60">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><KeyRound className="h-6 w-6" /></span>
        <h1 className="mt-4 font-heading text-2xl font-extrabold text-foreground">Cria uma nova palavra-passe</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A administração definiu uma palavra-passe temporária para a tua conta. Por segurança, tens de criar uma palavra-passe pessoal antes de continuares.</p>
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-xs text-primary"><ShieldCheck className="h-4 w-4 shrink-0" /> A tua conta e o histórico de quotas e pagamentos serão preservados.</p>
        <form onSubmit={submeter} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted-foreground">Nova palavra-passe</span>
            <span className="flex items-center gap-2 rounded-2xl border border-input px-3">
              <input type={ver ? 'text' : 'password'} value={nova} onChange={e => setNova(e.target.value)} autoComplete="new-password" className="h-12 w-full bg-transparent text-sm outline-none" />
              <button type="button" onClick={() => setVer(v => !v)} className="text-muted-foreground" aria-label="Mostrar ou esconder palavra-passe">{ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted-foreground">Confirmar nova palavra-passe</span>
            <input type={ver ? 'text' : 'password'} value={repetir} onChange={e => setRepetir(e.target.value)} autoComplete="new-password" className="h-12 w-full rounded-2xl border border-input px-3 text-sm outline-none focus:border-primary" />
          </label>
          <p className="text-[11px] text-muted-foreground">Mínimo de 8 caracteres. Não reutilizes a senha temporária.</p>
          {erro && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{erro}</p>}
          <button type="submit" disabled={aGuardar} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
            {aGuardar && <Loader2 className="h-4 w-4 animate-spin" />}{aGuardar ? 'A guardar…' : 'Guardar nova palavra-passe'}
          </button>
        </form>
      </main>
    </div>
  );
}
