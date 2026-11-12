import { useEffect, useMemo, useState } from 'react';
import SEO from '@/components/SEO';
import { CheckCircle2, Wallet } from 'lucide-react';
import AlertaAtraso from '@/components/AlertaAtraso';
import QuotaCard from '@/components/QuotaCard';
import { Carregando, ErroCaixa, Vazio } from '@/components/Estados';
import { quotasDoMotorista } from '@/lib/dados';
import { formatKz } from '@/lib/format';
import { useSessao } from '@/lib/sessao';

const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'por_pagar', rotulo: 'Por pagar' },
  { id: 'pagas', rotulo: 'Pagas' },
];

export default function MinhasQuotas() {
  <SEO title="QuotaMob | As minhas quotas" description="Consulte as suas quotas semanais, valores, datas de vencimento e estado dos pagamentos na QuotaMob." />
  const { perfil, nomeExibido } = useSessao();
  const [quotas, setQuotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('todas');

  async function carregar() {
    if (!perfil?.id) return;
    setCarregando(true);
    setErro('');
    try {
      setQuotas(await quotasDoMotorista(perfil.id));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [perfil?.id]);

  const emFalta = useMemo(
    () => quotas.filter((q) => q.estado === 'pendente' || q.estado === 'atrasada').reduce((s, q) => s + q.valor, 0),
    [quotas],
  );
  const emAnalise = useMemo(() => quotas.filter((q) => q.estado === 'em_analise').length, [quotas]);
  const pagas = useMemo(() => quotas.filter((q) => q.estado === 'paga').length, [quotas]);

  const visiveis = quotas.filter((q) => {
    if (filtro === 'pagas') return q.estado === 'paga';
    if (filtro === 'por_pagar') return q.estado !== 'paga';
    return true;
  });

  const primeiroNome = String(nomeExibido || '').split(' ')[0];

  return (
    <div className="space-y-5">
      <AlertaAtraso quotas={quotas} />

      <section className="animar-surgir overflow-hidden rounded-[26px] bg-primary p-5 text-primary-foreground shadow-[0_24px_50px_-32px_rgba(11,37,69,0.9)]">
        <p className="text-xs font-medium text-white/60">Olá, {primeiroNome}</p>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Total em falta</p>
        <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight">{formatKz(emFalta)}</p>
        <div className="mt-4 flex gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/80">{pagas} pagas</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/80">{emAnalise} em análise</span>
        </div>
      </section>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {FILTROS.map(({ id, rotulo }) => (
          <button
            key={id}
            onClick={() => setFiltro(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              filtro === id ? 'bg-primary text-primary-foreground' : 'bg-white text-muted-foreground ring-1 ring-border'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <ErroCaixa mensagem={erro} aoTentar={carregar} />

      {carregando ? (
        <Carregando texto="A carregar as tuas quotas…" />
      ) : visiveis.length === 0 ? (
        <Vazio
          icone={filtro === 'pagas' ? CheckCircle2 : Wallet}
          titulo={filtro === 'pagas' ? 'Ainda não tens quotas pagas' : 'Sem quotas por pagar'}
          texto={
            erro
              ? 'Não foi possível ler as quotas. Tenta novamente quando tiveres rede.'
              : 'Quando o tesoureiro gerar as quotas, elas aparecem aqui.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visiveis.map((quota) => (
            <QuotaCard key={quota.id} quota={quota} />
          ))}
        </div>
      )}
    </div>
  );
}