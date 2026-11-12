import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ehAdmin, useSessao } from '@/lib/sessao';

function ACarregar() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  );
}

function deveAlterarSenha(sessao) {
  return sessao?.utilizador?.app_metadata?.quotamob_must_change_password === true;
}

function destinoPerfil(perfil) {
  return ehAdmin(perfil) ? '/admin' : '/quotas';
}

export function RotaMotorista() {
  const { estado, perfil, sessao } = useSessao();
  if (estado === 'a_carregar') return <ACarregar />;
  if (!perfil) return <Navigate to="/" replace />;
  if (deveAlterarSenha(sessao)) return <Navigate to="/alterar-senha" replace />;
  if (ehAdmin(perfil)) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export function RotaUtilizador() {
  const { estado, perfil, sessao } = useSessao();
  if (estado === 'a_carregar') return <ACarregar />;
  if (!perfil) return <Navigate to="/" replace />;
  if (deveAlterarSenha(sessao)) return <Navigate to="/alterar-senha" replace />;
  return <Outlet />;
}

export function RotaAdmin() {
  const { estado, perfil, sessao } = useSessao();
  if (estado === 'a_carregar') return <ACarregar />;
  if (!perfil) return <Navigate to="/" replace />;
  if (deveAlterarSenha(sessao)) return <Navigate to="/alterar-senha" replace />;
  if (!ehAdmin(perfil)) return <Navigate to="/quotas" replace />;
  return <Outlet />;
}

export function RotaAlterarSenha() {
  const { estado, perfil, sessao } = useSessao();
  if (estado === 'a_carregar') return <ACarregar />;
  if (!perfil) return <Navigate to="/" replace />;
  if (!deveAlterarSenha(sessao)) return <Navigate to={destinoPerfil(perfil)} replace />;
  return <Outlet />;
}
