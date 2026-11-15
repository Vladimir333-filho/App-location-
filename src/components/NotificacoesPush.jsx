import { useState } from 'react';
import { BellRing, Check, Loader2 } from 'lucide-react';
import { activarNotificacoesPush } from '@/lib/push';

export default function NotificacoesPush() {
  const [estado, setEstado] = useState('inactivo');
  const [erro, setErro] = useState('');

  async function activar() {
    setEstado('a_activar');
    setErro('');
    try {
      await activarNotificacoesPush();
      setEstado('activo');
    } catch (falha) {
      setEstado('inactivo');
      setErro(falha.message || 'Não foi possível activar as notificações.');
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={activar}
        disabled={estado === 'a_activar' || estado === 'activo'}
        title={estado === 'activo' ? 'Notificações activadas neste dispositivo' : 'Activar alertas de novos pagamentos'}
        aria-label="Activar notificações push"
        className="flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-70"
      >
        {estado === 'a_activar' ? <Loader2 className="h-4 w-4 animate-spin" /> : estado === 'activo' ? <Check className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
        <span>{estado === 'activo' ? 'Alertas activos' : estado === 'a_activar' ? 'A activar…' : 'Activar alertas'}</span>
      </button>
      {erro && <p role="alert" className="max-w-[180px] text-right text-[10px] text-red-100">{erro}</p>}
    </div>
  );
}
