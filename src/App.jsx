import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';
import { SessaoProvider } from '@/lib/sessao';
import AppShell, { ITENS_ADMIN } from '@/components/AppShell';
import { RotaAdmin, RotaMotorista, RotaUtilizador, RotaAlterarSenha } from '@/components/RotaProtegida';
import PageNotFound from '@/lib/PageNotFound';

// Carrega cada página apenas quando a rota é aberta.
const Entrar = lazy(() => import('@/pages/Entrar'));
const CriarConta = lazy(() => import('@/pages/CriarConta'));
const RecuperarSenha = lazy(() => import('@/pages/RecuperarSenha'));
const AlterarSenha = lazy(() => import('@/pages/AlterarSenha'));
const MinhasQuotas = lazy(() => import('@/pages/MinhasQuotas'));
const PagarQuota = lazy(() => import('@/pages/PagarQuota'));
const Historico = lazy(() => import('@/pages/Historico'));
const Perfil = lazy(() => import('@/pages/Perfil'));
const Seguranca = lazy(() => import('@/pages/Seguranca'));

const Painel = lazy(() => import('@/pages/admin/Painel'));
const Aprovacoes = lazy(() => import('@/pages/admin/Aprovacoes'));
const Motoristas = lazy(() => import('@/pages/admin/Motoristas'));
const GerarQuotas = lazy(() => import('@/pages/admin/GerarQuotas'));
const Configuracoes = lazy(() => import('@/pages/admin/Configuracoes'));

function CarregamentoPagina() {
  return (
    <div className="grid min-h-[40vh] place-items-center text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
      A carregar…
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <SessaoProvider>
        <ScrollToTop />
        <Suspense fallback={<CarregamentoPagina />}>
          <Routes>
            <Route path="/" element={<Entrar />} />
            <Route path="/entrar" element={<Entrar />} />
            <Route path="/criar-conta" element={<CriarConta />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route element={<RotaAlterarSenha />}>
              <Route path="/alterar-senha" element={<AlterarSenha />} />
            </Route>

            <Route element={<RotaMotorista />}>
              <Route element={<AppShell />}>
                <Route path="/quotas" element={<MinhasQuotas />} />
                <Route path="/historico" element={<Historico />} />
              </Route>
              <Route path="/quotas/:quotaId/pagar" element={<PagarQuota />} />
            </Route>

            <Route element={<RotaAdmin />}>
              <Route element={<AppShell itens={ITENS_ADMIN} mostrarConfig />}>
                <Route path="/admin" element={<Painel />} />
                <Route path="/admin/aprovacoes" element={<Aprovacoes />} />
                <Route path="/admin/motoristas" element={<Motoristas />} />
                <Route path="/admin/quotas" element={<GerarQuotas />} />
                <Route path="/admin/configuracoes" element={<Configuracoes />} />
              </Route>
            </Route>

            <Route element={<RotaUtilizador />}>
              <Route element={<AppShell />}>
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/seguranca" element={<Seguranca />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </SessaoProvider>
    </Router>
  );
}
