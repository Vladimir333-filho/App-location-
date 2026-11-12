import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

export default function RecuperarSenha() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="QuotaMob | Recuperar palavra-passe" description="Recuperação assistida da palavra-passe da conta QuotaMob." />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="bg-primary px-6 pb-16 pt-10 text-primary-foreground">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/85"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><KeyRound className="h-5 w-5" /></span>
          <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Recuperar palavra-passe</h1>
          <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-white/70">Recuperação segura com apoio da administração.</p>
        </header>
        <main className="-mt-10 flex-1 px-5 pb-10">
          <div className="animar-surgir rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(11,37,69,0.55)] ring-1 ring-border/60">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></span>
            <h2 className="mt-3 font-heading text-lg font-bold text-foreground">Contacta a administração</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Para proteger a tua conta, a reposição da palavra-passe é feita pelo administrador ou tesoureiro. A tua identidade e o número associado à conta serão confirmados antes de ser definida uma nova palavra-passe.</p>
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">O Google Authenticator protege o início de sessão quando está activado. A reposição da palavra-passe, por si só, não desactiva essa protecção.</p>
            <Link to="/" className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">Voltar ao início de sessão</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
