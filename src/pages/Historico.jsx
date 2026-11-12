import { useEffect, useState } from 'react';
import SEO from '@/components/SEO';
import { Download, Receipt } from 'lucide-react';
import EstadoBadge from '@/components/EstadoBadge';
import { Carregando, ErroCaixa, Vazio } from '@/components/Estados';
import { pagamentosDoMotorista, quotasDoMotorista } from '@/lib/dados';
import { formatKz, formatData } from '@/lib/format';
import { descarregarRecibo } from '@/lib/recibo';
import { useSessao } from '@/lib/sessao';

export default function Historico() {
  <SEO title="QuotaMob | Histórico de pagamentos" description="Consulte o histórico das suas quotas e pagamentos, incluindo os comprovativos e respectivos estados." />
  const { perfil } = useSessao();
  const [pagamentos, setPagamentos] = useState([]);
  const [quotasPorId, setQuotasPorId] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregar() {
    if (!perfil?.id) return;
    setCarregando(true);
    setErro('');
    try {
      const [listaPagamentos, listaQuotas] = await Promise.all([
        pagamentosDoMotorista(perfil.id),
        quotasDoMotorista(perfil.id),
      ]);
      const mapa = {};
      listaQuotas.forEach((quota) => {
        mapa[quota.id] = quota;
      });
      setPagamentos(listaPagamentos);
      setQuotasPorId(mapa);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [perfil?.id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todos os comprovativos que enviaste.</p>
      </div>

      <ErroCaixa mensagem={erro} aoTentar={carregar} />

      {carregando ? (
        <Carregando texto="A carregar o teu histórico…" />
      ) : pagamentos.length === 0 ? (
        <Vazio
          icone={Receipt}
          titulo="Ainda não enviaste pagamentos"
          texto="Quando enviares um comprovativo, ele aparece aqui e podes descarregar o recibo."
        />
      ) : (
        <div className="space-y-3">
          {pagamentos.map((pagamento) => {
            const quota = quotasPorId[pagamento.quotaId];
            return (
              <article key={pagamento.id} className="rounded-3xl bg-white p-4 ring-1 ring-border/70">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-bold text-foreground">
                      {quota?.referencia || 'Quota'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Enviado a {formatData(pagamento.criadoEm)}
                    </p>
                  </div>
                  <EstadoBadge estado={pagamento.estado} />
                </div>

                <p className="mt-3 font-heading text-xl font-extrabold text-primary">{formatKz(pagamento.valor)}</p>

                {pagamento.estado === 'rejeitado' && pagamento.motivo && (
                  <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
                    Motivo: {pagamento.motivo}
                  </p>
                )}

                <button
                  onClick={() => descarregarRecibo({ motorista: perfil, quota, pagamento })}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary/5 text-sm font-bold text-primary"
                >
                  <Download className="h-4 w-4" />
                  Descarregar recibo
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}