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

export function RotaMotorista() {
  const { estado, perfil } = useSessao();
  if (estado === 'a_carregar') return <ACarregar />;
  if (!perfil) return <Navigate to="/" replace />;
  if (ehAdmin(perfil)) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export function RotaUtilizador() {
  const { estado, perfil } = useSessao();
  if (estado === 'a_carregar') return <ACarregar />;
  if (!perfil) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RotaAdmin() {
  const { estado, perfil } = useSessao();
  if (estado === 'a_carregar') return <ACarregar />;
  if (!perfil) return <Navigate to="/" replace />;
  if (!ehAdmin(perfil)) return <Navigate to="/quotas" replace />;
  return <Outlet />;
}