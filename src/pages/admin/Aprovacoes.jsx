import { useEffect, useState } from 'react';
import SEO from '@/components/SEO';
import { Check, ClipboardCheck, ExternalLink, FileText, Loader2, Phone, X } from 'lucide-react';
import EstadoBadge from '@/components/EstadoBadge';
import { Carregando, ErroCaixa, Vazio } from '@/components/Estados';
import {
  aprovarPagamento,
  linkDoComprovativo,
  listarMotoristas,
  listarPagamentos,
  listarQuotas,
  rejeitarPagamento,
} from '@/lib/dados';
import { formatData, formatKz, formatarTelefone } from '@/lib/format';

export default function Aprovacoes() {
  <SEO title="QuotaMob | Aprovação de pagamentos" description="Analise os comprovativos submetidos pelos motoristas e aprove ou rejeite pagamentos de quotas semanais." />
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [emCurso, setEmCurso] = useState(null);
  const [rejeitar, setRejeitar] = useState(null);
  const [motivo, setMotivo] = useState('');

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [pagamentos, motoristas, quotas] = await Promise.all([
        listarPagamentos(),
        listarMotoristas(),
        listarQuotas(),
      ]);
      const motoristasPorId = {};
      motoristas.forEach((m) => {
        motoristasPorId[m.id] = m;
      });
      const quotasPorId = {};
      quotas.forEach((q) => {
        quotasPorId[q.id] = q;
      });

      const pendentes = pagamentos.filter((pagamento) => pagamento.estado === 'em_analise');
      const comLinks = await Promise.all(
        pendentes.map(async (pagamento) => ({
          ...pagamento,
          motorista: motoristasPorId[pagamento.motoristaId],
          quota: quotasPorId[pagamento.quotaId],
          link: await linkDoComprovativo(pagamento.comprovativo),
        })),
      );
      setItens(comLinks);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function confirmarAprovacao(pagamento) {
    setEmCurso(pagamento.id);
    setErro('');
    try {
      await aprovarPagamento(pagamento);
      setItens((anteriores) => anteriores.filter((item) => item.id !== pagamento.id));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEmCurso(null);
    }
  }

  async function confirmarRejeicao() {
    if (!motivo.trim()) {
      setErro('Escreve o motivo da rejeição para o motorista saber o que corrigir.');
      return;
    }
    setEmCurso(rejeitar.id);
    setErro('');
    try {
      await rejeitarPagamento(rejeitar, motivo.trim());
      setItens((anteriores) => anteriores.filter((item) => item.id !== rejeitar.id));
      setRejeitar(null);
      setMotivo('');
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEmCurso(null);
    }
  }

  if (carregando) return <Carregando texto="A carregar comprovativos…" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Aprovações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {itens.length === 0 ? 'Sem comprovativos à espera.' : `${itens.length} comprovativos à espera de confirmação.`}
        </p>
      </div>

      <ErroCaixa mensagem={erro} aoTentar={carregar} />

      {itens.length === 0 ? (
        <Vazio icone={ClipboardCheck} titulo="Tudo em ordem" texto="Quando um motorista enviar um comprovativo, ele aparece aqui." />
      ) : (
        itens.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-3xl bg-white ring-1 ring-border/70">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-bold text-foreground">
                  {item.motorista?.nome || 'Motorista'}
                </p>
                <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <Phone className="h-3 w-3" /> +244 {formatarTelefone(item.motorista?.telefone)}
                </p>
              </div>
              <EstadoBadge estado="em_analise" />
            </div>

            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 border-b border-border/70 px-4 py-3 text-primary"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-bold">Abrir comprovativo (PDF)</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <div className="grid h-20 w-full place-items-center border-b border-border/70 bg-muted text-xs text-muted-foreground">
                Comprovativo indisponível
              </div>
            )}

            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Quota</p>
                  <p className="truncate text-sm font-semibold text-foreground">{item.quota?.referencia || '—'}</p>
                  <p className="text-[11px] text-muted-foreground">Enviado a {formatData(item.criadoEm)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Valor pago</p>
                  <p className="font-heading text-lg font-extrabold text-primary">{formatKz(item.valor)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => confirmarAprovacao(item)}
                  disabled={emCurso === item.id}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-success text-sm font-bold text-success-foreground disabled:opacity-60"
                >
                  {emCurso === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Aprovar
                </button>
                <button
                  onClick={() => {
                    setRejeitar(item);
                    setMotivo('');
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-bold text-red-700"
                >
                  <X className="h-4 w-4" />
                  Rejeitar
                </button>
              </div>
            </div>
          </article>
        ))
      )}

      {rejeitar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-4 backdrop-blur-sm">
          <div className="animar-surgir w-full max-w-md rounded-3xl bg-white p-5">
            <h2 className="font-heading text-lg font-bold text-foreground">Rejeitar comprovativo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {rejeitar.motorista?.nome || 'Motorista'} vai ver este motivo no histórico.
            </p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Ex.: o valor pago não corresponde ao valor da quota."
              className="mt-3 w-full rounded-2xl border border-input p-3 text-sm outline-none focus:border-primary"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setRejeitar(null)}
                className="h-12 rounded-2xl bg-muted text-sm font-bold text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRejeicao}
                disabled={emCurso === rejeitar.id}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-bold text-white disabled:opacity-60"
              >
                {emCurso === rejeitar.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}