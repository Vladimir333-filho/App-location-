import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from '@/components/ScrollToTop';
import { SessaoProvider } from '@/lib/sessao';
import AppShell, { ITENS_ADMIN } from '@/components/AppShell';
import { RotaAdmin, RotaMotorista, RotaUtilizador } from '@/components/RotaProtegida';
import PageNotFound from '@/lib/PageNotFound';

// Páginas QuotaMob
import Entrar from '@/pages/Entrar';
import CriarConta from '@/pages/CriarConta';
import RecuperarSenha from '@/pages/RecuperarSenha';
import MinhasQuotas from '@/pages/MinhasQuotas';
import PagarQuota from '@/pages/PagarQuota';
import Historico from '@/pages/Historico';
import Perfil from '@/pages/Perfil';
import Seguranca from '@/pages/Seguranca';

// Páginas Administração QuotaMob
import Painel from '@/pages/admin/Painel';
import Aprovacoes from '@/pages/admin/Aprovacoes';
import Motoristas from '@/pages/admin/Motoristas';
import GerarQuotas from '@/pages/admin/GerarQuotas';
import Configuracoes from '@/pages/admin/Configuracoes';

export default function App() {
  return (
    <Router>
      <SessaoProvider>
        <ScrollToTop />
        <Routes>
          {/* Autenticação QuotaMob */}
          <Route path="/" element={<Entrar />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/criar-conta" element={<CriarConta />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />

          {/* Área do Motorista */}
          <Route element={<RotaMotorista />}>
            <Route element={<AppShell />}>
              <Route path="/quotas" element={<MinhasQuotas />} />
              <Route path="/historico" element={<Historico />} />
            </Route>
            <Route path="/quotas/:quotaId/pagar" element={<PagarQuota />} />
          </Route>

          {/* Área do Tesoureiro / Admin */}
          <Route element={<RotaAdmin />}>
            <Route element={<AppShell itens={ITENS_ADMIN} mostrarConfig />}>
              <Route path="/admin" element={<Painel />} />
              <Route path="/admin/aprovacoes" element={<Aprovacoes />} />
              <Route path="/admin/motoristas" element={<Motoristas />} />
              <Route path="/admin/quotas" element={<GerarQuotas />} />
              <Route path="/admin/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          {/* Perfil (qualquer utilizador autenticado) */}
          <Route element={<RotaUtilizador />}>
            <Route element={<AppShell />}>
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/seguranca" element={<Seguranca />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Toaster />
      </SessaoProvider>
    </Router>
  );
}