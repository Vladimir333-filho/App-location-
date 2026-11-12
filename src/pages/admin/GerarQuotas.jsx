import { useEffect, useMemo, useState } from 'react';
import SEO from '@/components/SEO';
import { CalendarPlus, CheckCircle2, Loader2 } from 'lucide-react';
import QuotasGeradas from '@/components/admin/QuotasGeradas';
import { Carregando, ErroCaixa } from '@/components/Estados';
import {
  QUOTA_SEMANAL_MAXIMA,
  SEMANAS_DO_MES,
  eliminarQuotas,
  gerarQuotas,
  limpo,
  listarMotoristas,
  listarPagamentos,
  listarQuotas,
} from '@/lib/dados';
import { formatKz, formatData, hojeISO } from '@/lib/format';

export default function GerarQuotas() {
  <SEO title="QuotaMob | Gestão de quotas" description="Gere e consulte as quotas semanais dos motoristas, com controlo de valores e datas de vencimento." />
  const [motoristas, setMotoristas] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [quotasComPagamento, setQuotasComPagamento] = useState(new Set());
  const [referenciasExistentes, setReferenciasExistentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aGerar, setAGerar] = useState(null);
  const [resultado, setResultado] = useState(null);

  const [referencia, setReferencia] = useState('');
  const [valor, setValor] = useState(String(QUOTA_SEMANAL_MAXIMA));
  const [vencimento, setVencimento] = useState(hojeISO());

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [listaMotoristas, listaQuotas, listaPagamentos] = await Promise.all([
        listarMotoristas(),
        listarQuotas(),
        listarPagamentos(),
      ]);
      setMotoristas(listaMotoristas.filter((motorista) => motorista.ativo));
      setQuotas(listaQuotas);
      setQuotasComPagamento(new Set(listaPagamentos.map((pagamento) => pagamento.quotaId)));
      setReferenciasExistentes(listaQuotas.map((quota) => limpo(quota.referencia)));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const jaExiste = useMemo(
    () => Boolean(referencia) && referenciasExistentes.includes(limpo(referencia)),
    [referencia, referenciasExistentes],
  );

  async function gerar() {
    setErro('');
    setResultado(null);
    if (!referencia.trim()) {
      setErro('Escreve a referência da quota, por exemplo: Semana 45/2026.');
      return;
    }
    if (!Number(valor)) {
      setErro('Escreve o valor da quota em kwanzas.');
      return;
    }
    if (Number(valor) > QUOTA_SEMANAL_MAXIMA) {
      setErro(`A quota é semanal e não pode passar ${formatKz(QUOTA_SEMANAL_MAXIMA)}.`);
      return;
    }
    if (!vencimento) {
      setErro('Escolhe a data de vencimento.');
      return;
    }
    setAGerar(motoristas.length);
    try {
      const total = await gerarQuotas({
        referencia: referencia.trim(),
        valor: Number(valor),
        vencimento,
        motoristas,
      });
      setResultado(total);
      setReferencia('');
      setValor('');
      await carregar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAGerar(null);
    }
  }

  if (carregando) return <Carregando texto="A carregar motoristas ativos…" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Gerar quotas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cria uma quota para cada um dos {motoristas.length} motoristas ativos.
        </p>
      </div>

      <div className="card-suave space-y-3 p-4">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Referência</span>
          <input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Semana 45/2026"
            className="h-12 w-full rounded-2xl border border-input px-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Valor semanal (máx. 1.000)
            </span>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
              inputMode="numeric"
              placeholder="1000"
              className="h-12 w-full rounded-2xl border border-input px-3 font-heading text-base font-bold outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Vencimento</span>
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="h-12 w-full rounded-2xl border border-input px-2 text-xs outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="space-y-1 rounded-2xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            Vai criar <span className="font-bold text-foreground">{motoristas.length} quotas semanais</span> de{' '}
            <span className="font-bold text-foreground">{formatKz(valor || 0)}</span>, com vencimento a{' '}
            <span className="font-bold text-foreground">{formatData(vencimento)}</span>.
          </p>
          <p>
            {SEMANAS_DO_MES} semanas × {formatKz(valor || 0)} ={' '}
            <span className="font-bold text-primary">{formatKz(Number(valor || 0) * SEMANAS_DO_MES)} por mês</span>
          </p>
        </div>

        {jaExiste && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Esta referência já foi usada. Só serão criadas quotas para os motoristas que ainda não a têm.
          </p>
        )}

        <ErroCaixa mensagem={erro} />

        {resultado !== null && (
          <p className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            {resultado === 0
              ? 'Todos os motoristas ativos já tinham esta quota. Nada foi duplicado.'
              : `${resultado} quotas criadas com sucesso.`}
          </p>
        )}

        <button
          onClick={gerar}
          disabled={aGerar !== null || motoristas.length === 0}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-60"
        >
          {aGerar !== null ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarPlus className="h-5 w-5" />}
          {aGerar !== null ? 'A gerar…' : 'Gerar para todos os ativos'}
        </button>
      </div>

      {motoristas.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Não há motoristas ativos. Ativa motoristas antes de gerar quotas.
        </p>
      )}

      <QuotasGeradas
        quotas={quotas}
        quotasComPagamento={quotasComPagamento}
        aoEliminar={async (ids) => {
          await eliminarQuotas(ids);
          await carregar();
        }}
      />
    </div>
  );
}