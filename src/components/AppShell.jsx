import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { CalendarPlus, ClipboardCheck, LayoutDashboard, LogOut, Receipt, Settings, Users, Wallet } from 'lucide-react';
import FotoPerfil from '@/components/FotoPerfil';
import { contarPagamentosEmAnalise } from '@/lib/dados';
import { useSessao } from '@/lib/sessao';
import { useToast } from '@/components/ui/use-toast';

export const ITENS_MOTORISTA = [
  { para: '/quotas', rotulo: 'Quotas', Icone: Wallet },
  { para: '/historico', rotulo: 'Histórico', Icone: Receipt },
];

export const ITENS_ADMIN = [
  { para: '/admin', rotulo: 'Painel', Icone: LayoutDashboard, exato: true },
  { para: '/admin/aprovacoes', rotulo: 'Aprovar', Icone: ClipboardCheck },
  { para: '/admin/motoristas', rotulo: 'Motoristas', Icone: Users },
  { para: '/admin/quotas', rotulo: 'Quotas', Icone: CalendarPlus },
];

export default function AppShell({ itens, mostrarConfig }) {
  const { nomeExibido, sair, administrador, perfil } = useSessao();
  const lista = itens || (administrador ? ITENS_ADMIN : ITENS_MOTORISTA);
  const comConfig = mostrarConfig ?? administrador;
  const { toast } = useToast();
  const [pendentes, setPendentes] = useState(0);
  const ultimo = useRef(null);

  useEffect(() => {
    if (!administrador) return;
    let vivo = true;
    async function contar() {
      try {
        const total = await contarPagamentosEmAnalise();
        if (!vivo) return;
        const anterior = ultimo.current;
        ultimo.current = total;
        setPendentes(total);
        if (anterior !== null && total > anterior) {
          toast({
            title: 'Novo comprovativo para aprovar',
            description: `${total - anterior} pagamento(s) novo(s) em análise.`,
          });
        }
      } catch {
        /* sem rede: mantém o último valor */
      }
    }
    contar();
    const relogio = setInterval(contar, 20000);
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') contar();
    };
    window.addEventListener('focus', aoVoltar);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      vivo = false;
      clearInterval(relogio);
      window.removeEventListener('focus', aoVoltar);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [administrador, toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md">
        <header className="sticky top-0 z-30 bg-primary px-5 pb-5 pt-6 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <Link to="/perfil" className="flex min-w-0 items-center gap-2.5">
              <FotoPerfil nome={nomeExibido} fotoUrl={perfil?.foto} tamanho="sm" className="ring-2 ring-white/25" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  {administrador ? 'Tesouraria' : 'QuotaMob'}
                </p>
                <p className="mt-0.5 truncate font-heading text-lg font-bold">{nomeExibido}</p>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              {comConfig && (
                <Link
                  to="/admin/configuracoes"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/80 transition active:scale-95"
                  aria-label="Dados de pagamento"
                >
                  <Settings className="h-[18px] w-[18px]" />
                </Link>
              )}
              <button
                onClick={sair}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/80 transition active:scale-95"
                aria-label="Sair"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-5">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-md">
        <div className="safe-bottom mx-auto flex w-full max-w-md items-stretch justify-around px-2 pt-1.5">
          {lista.map(({ para, rotulo, Icone, exato }) => (
            <NavLink
              key={para}
              to={para}
              end={exato}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`relative grid h-9 w-12 place-items-center rounded-xl transition ${isActive ? 'bg-primary/10' : ''}`}>
                    <Icone className="h-5 w-5" />
                    {para === '/admin/aprovacoes' && pendentes > 0 && (
                      <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {pendentes}
                      </span>
                    )}
                  </span>
                  {rotulo}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}