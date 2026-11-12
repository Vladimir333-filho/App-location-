import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarRange, Download, Loader2, TrendingUp, Undo2, Users, Wallet } from 'lucide-react';
import EmAtraso from '@/components/admin/EmAtraso';
import EstadoBadge from '@/components/EstadoBadge';
import { Carregando, ErroCaixa, Vazio } from '@/components/Estados';
import { descarregarCsv, listarMotoristas, listarPagamentos, listarQuotas, rejeitarPagamento } from '@/lib/dados';
import { formatKz } from '@/lib/format';

const ESTADOS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'paga', rotulo: 'Pagas' },
  { id: 'em_analise', rotulo: 'Em análise' },
  { id: 'atrasada', rotulo: 'Atrasadas' },
  { id: 'pendente', rotulo: 'Pendentes' },
];

export default function Painel() {
  const [motoristas, setMotoristas] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('pagou');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [estado, setEstado] = useState('todas');
  const [aAnular, setAAnular] = useState(null);
  const [motivoAnular, setMotivoAnular] = useState('');
  const [aAnularCurso, setAAnularCurso] = useState(false);
  const [erroAnular, setErroAnular] = useState('');

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [listaMotoristas, listaQuotas, listaPagamentos] = await Promise.all([
        listarMotoristas(),
        listarQuotas(),
        listarPagamentos(),
      ]);
      setMotoristas(listaMotoristas);
      setQuotas(listaQuotas);
      setPagamentos(listaPagamentos);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const nomePorId = useMemo(() => {
    const mapa = {};
    motoristas.forEach((motorista) => {
      mapa[motorista.id] = motorista;
    });
    return mapa;
  }, [motoristas]);

  const totais = useMemo(() => {
    const esperado = quotas.reduce((soma, quota) => soma + quota.valor, 0);
    const recebido = pagamentos
      .filter((pagamento) => pagamento.estado === 'aprovado')
      .reduce((soma, pagamento) => soma + pagamento.valor, 0);
    const emAtraso = quotas
      .filter((quota) => quota.estado === 'atrasada')
      .reduce((soma, quota) => soma + quota.valor, 0);
    // Adesão é um contador simples: 0, 1, 2, 3… sobe 1 por cada pagamento feito.
    const pagas = quotas.filter((quota) => quota.estado === 'paga').length;
    return { esperado, recebido, emAtraso, adesao: pagas, pagas };
  }, [quotas, pagamentos]);

  const pagamentoPorQuota = useMemo(() => {
    const mapa = {};
    pagamentos.forEach((pagamento) => {
      if (pagamento.estado === 'aprovado' && mapa[pagamento.quotaId] === undefined) {
        mapa[pagamento.quotaId] = pagamento;
      }
    });
    return mapa;
  }, [pagamentos]);

  const quotasFiltradas = useMemo(() => {
    return quotas.filter((quota) => {
      if (estado !== 'todas' && quota.estado !== estado) return false;
      if (de && (!quota.vencimento || quota.vencimento < de)) return false;
      if (ate && (!quota.vencimento || quota.vencimento > ate)) return false;
      return true;
    });
  }, [quotas, estado, de, ate]);

  const quemPagou = quotasFiltradas.filter((quota) => quota.estado === 'paga');
  const quemDeve = quotasFiltradas.filter((quota) => quota.estado === 'atrasada' || quota.estado === 'pendente');
  const listaAtual = aba === 'pagou' ? quemPagou : quemDeve;

  function exportar() {
    const linhas = [
      ['Referência', 'Motorista', 'Telefone', 'Valor (Kz)', 'Vencimento', 'Estado'],
      ...quotasFiltradas.map((quota) => [
        quota.referencia,
        nomePorId[quota.motoristaId]?.nome || '—',
        nomePorId[quota.motoristaId]?.telefone || '—',
        quota.valor,
        quota.vencimento || '',
        quota.estado,
      ]),
    ];
    const sufixo = [de, ate, estado].filter(Boolean).join('-') || 'completo';
    descarregarCsv(`quotamob-relatorio-${sufixo}.csv`, linhas);
  }

  function abrirAnulacao(quota, pagamento) {
    setErroAnular('');
    setMotivoAnular('');
    setAAnular({ quota, pagamento });
  }

  async function confirmarAnulacao() {
    setAAnularCurso(true);
    setErroAnular('');
    try {
      await rejeitarPagamento(aAnular.pagamento, motivoAnular.trim() || 'Aprovação anulada pelo tesoureiro.');
      setAAnular(null);
      await carregar();
    } catch (falha) {
      setErroAnular(falha.message);
    } finally {
      setAAnularCurso(false);
    }
  }

  if (carregando) return <Carregando texto="A carregar o painel…" />;

  return (
    <div className="space-y-5">
      <ErroCaixa mensagem={erro} aoTentar={carregar} />

      <div className="grid grid-cols-2 gap-3">
        <Cartao rotulo="Total esperado" valor={formatKz(totais.esperado)} Icone={Wallet} />
        <Cartao rotulo="Total recebido" valor={formatKz(totais.recebido)} Icone={TrendingUp} destaque="verde" />
        <Cartao rotulo="Total em atraso" valor={formatKz(totais.emAtraso)} Icone={CalendarRange} destaque="vermelho" />
        <Cartao rotulo="Adesão · pagamentos" valor={String(totais.adesao)} Icone={Users} destaque="azul" />
      </div>

      <EmAtraso quotas={quotasFiltradas} nomePorId={nomePorId} />

      <Link
        to="/admin/aprovacoes"
        className="flex items-center justify-between rounded-3xl bg-primary px-4 py-4 text-primary-foreground"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Fila de aprovação</p>
          <p className="mt-1 font-heading text-base font-bold">
            {pagamentos.filter((pagamento) => pagamento.estado === 'em_analise').length} comprovativos em análise
          </p>
        </div>
        <ArrowRight className="h-5 w-5" />
      </Link>

      <section className="space-y-3 rounded-3xl bg-white p-4 ring-1 ring-border/70">
        <div className="flex items-center justify-between">
          <p className="font-heading text-sm font-bold text-foreground">Relatório</p>
          <button
            onClick={exportar}
            className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-[11px] font-bold text-success"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">De</span>
            <input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-white px-2 text-xs outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Até</span>
            <input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-white px-2 text-xs outline-none focus:border-primary"
            />
          </label>
        </div>
      </section>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {ESTADOS.map((opcao) => (
          <button
            key={opcao.id}
            onClick={() => setEstado(opcao.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              estado === opcao.id ? 'bg-primary text-primary-foreground' : 'bg-white text-muted-foreground ring-1 ring-border'
            }`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1">
        <button
          onClick={() => setAba('pagou')}
          className={`rounded-xl py-2.5 text-xs font-bold transition ${aba === 'pagou' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
        >
          Quem pagou ({quemPagou.length})
        </button>
        <button
          onClick={() => setAba('deve')}
          className={`rounded-xl py-2.5 text-xs font-bold transition ${aba === 'deve' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
        >
          Quem deve ({quemDeve.length})
        </button>
      </div>

      {listaAtual.length === 0 ? (
        <Vazio
          titulo={aba === 'pagou' ? 'Ninguém pagou neste filtro' : 'Ninguém em falta'}
          texto="Muda o período ou o estado para ver outros registos."
        />
      ) : (
        <div className="space-y-2">
          {listaAtual.slice(0, 60).map((quota) => {
            const motorista = nomePorId[quota.motoristaId];
            const pagamento = pagamentoPorQuota[quota.id];
            return (
              <div
                key={quota.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-border/70"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{motorista?.nome || 'Motorista'}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {quota.referencia} · {motorista?.telefone ? `+244 ${motorista.telefone}` : 'sem telefone'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className="font-heading text-sm font-extrabold text-primary">{formatKz(quota.valor)}</p>
                    <EstadoBadge estado={quota.estado} className="mt-1" />
                  </div>
                  {pagamento && (
                    <button
                      onClick={() => abrirAnulacao(quota, pagamento)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600"
                      aria-label="Anular comprovativo aprovado"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aAnular && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-4 backdrop-blur-sm">
          <div className="animar-surgir w-full max-w-md rounded-3xl bg-white p-5">
            <h2 className="font-heading text-lg font-bold text-foreground">Anular comprovativo</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {nomePorId[aAnular.quota.motoristaId]?.nome || 'Motorista'} · {aAnular.quota.referencia} ·{' '}
              {formatKz(aAnular.quota.valor)}. A quota volta a ficar pendente e o motivo aparece no histórico do
              motorista.
            </p>
            <textarea
              value={motivoAnular}
              onChange={(e) => setMotivoAnular(e.target.value)}
              rows={3}
              placeholder="Motivo (opcional)"
              className="mt-3 w-full rounded-2xl border border-input p-3 text-sm outline-none focus:border-primary"
            />
            {erroAnular && (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs leading-snug text-red-700">{erroAnular}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setAAnular(null)}
                className="h-12 rounded-2xl bg-muted text-sm font-bold text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAnulacao}
                disabled={aAnularCurso}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-bold text-white disabled:opacity-60"
              >
                {aAnularCurso && <Loader2 className="h-4 w-4 animate-spin" />}
                Anular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Cartao({ rotulo, valor, Icone, destaque = 'escuro' }) {
  const estilos = {
    escuro: 'bg-white text-foreground',
    verde: 'bg-success/10 text-success ring-success/20',
    vermelho: 'bg-red-50 text-red-700 ring-red-100',
    azul: 'bg-sky-50 text-sky-800 ring-sky-100',
  };
  return (
    <div className={`rounded-3xl p-4 ring-1 ring-border/70 ${estilos[destaque] || estilos.escuro}`}>
      <div className="flex items-center gap-1.5 opacity-70">
        <Icone className="h-3.5 w-3.5" />
        <p className="text-[10px] font-bold uppercase tracking-wide">{rotulo}</p>
      </div>
      <p className="mt-2 font-heading text-lg font-extrabold leading-tight">{valor}</p>
    </div>
  );
}