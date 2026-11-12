import { useEffect, useMemo, useRef, useState } from 'react';
import SEO from '@/components/SEO';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, Copy, FileText, Loader2, Upload, X } from 'lucide-react';
import { Carregando, ErroCaixa } from '@/components/Estados';
import EstadoBadge from '@/components/EstadoBadge';
import { quotasDoMotorista, submeterComprovativo } from '@/lib/dados';
import { formatKz, formatData, textoVencimento } from '@/lib/format';
import { lerDadosPagamento } from '@/lib/configPagamento';
import { useSessao } from '@/lib/sessao';
import { tamanhoLegivel, validarComprovativo } from '@/lib/validarComprovativo';

export default function PagarQuota() {
  <SEO title="QuotaMob | Pagar quota" description="Consulte os dados de pagamento e submeta o comprovativo da sua quota semanal na plataforma QuotaMob." />
  const { quotaId } = useParams();
  const navigate = useNavigate();
  const { perfil } = useSessao();
  const dadosPagamento = useMemo(() => lerDadosPagamento(), []);

  const [quota, setQuota] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [valor, setValor] = useState('');
  const [ficheiro, setFicheiro] = useState(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [copiado, setCopiado] = useState('');
  const [enviado, setEnviado] = useState(false);

  const refFicheiro = useRef(null);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      if (!perfil?.id) return;
      setCarregando(true);
      try {
        const lista = await quotasDoMotorista(perfil.id);
        const encontrada = lista.find((q) => String(q.id) === String(quotaId));
        if (!vivo) return;
        setQuota(encontrada || null);
        if (encontrada) setValor(String(Math.round(encontrada.valor)));
      } catch (falha) {
        if (vivo) setErro(falha.message);
      } finally {
        if (vivo) setCarregando(false);
      }
    }
    carregar();
    return () => {
      vivo = false;
    };
  }, [perfil?.id, quotaId]);

  async function escolherFicheiro(evento) {
    const selecionado = evento.target.files?.[0];
    evento.target.value = '';
    if (!selecionado) return;

    setErro('');
    setFicheiro(null);

    try {
      await validarComprovativo(selecionado);
      setFicheiro(selecionado);
    } catch (falha) {
      setErro(falha.message);
    }
  }

  async function copiar(texto, marca) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(marca);
      setTimeout(() => setCopiado(''), 1800);
    } catch {
      setErro('Não foi possível copiar. Escreve o número à mão.');
    }
  }

  async function enviar() {
    setErro('');
    if (quota.estado === 'paga') {
      setErro('Esta quota já está paga. Não é preciso enviar outro comprovativo.');
      return;
    }
    if (quota.estado === 'em_analise') {
      setErro('Já existe um comprovativo em análise para esta quota.');
      return;
    }
    const quantia = Number(String(valor).replace(/[^\d.]/g, ''));
    if (!quantia || quantia <= 0) {
      setErro('Escreve o valor que pagaste, em kwanzas.');
      return;
    }
    if (!ficheiro) {
      setErro('Anexa o comprovativo do Multicaixa Express em PDF.');
      return;
    }
    setAEnviar(true);
    try {
      await submeterComprovativo({
        quota,
        motoristaId: perfil.id,
        valorPago: quantia,
        ficheiro,
      });
      setEnviado(true);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAEnviar(false);
    }
  }

  if (carregando) return <Carregando texto="A carregar a quota…" />;

  if (enviado) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-10 w-10" />
        </span>
        <h1 className="mt-6 font-heading text-2xl font-extrabold text-foreground">Comprovativo enviado</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A quota ficou <span className="font-semibold text-sky-700">em análise</span>. O tesoureiro vai confirmar o pagamento
          em breve.
        </p>
        <button
          onClick={() => navigate('/quotas', { replace: true })}
          className="mt-8 h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground"
        >
          Voltar às minhas quotas
        </button>
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-16 text-center">
        <p className="font-heading text-lg font-bold text-foreground">Quota não encontrada</p>
        <p className="mt-2 text-sm text-muted-foreground">Esta quota já não está disponível na tua conta.</p>
        <button onClick={() => navigate('/quotas')} className="mt-6 h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
          Voltar às quotas
        </button>
      </div>
    );
  }

  const semDadosBancarios = !dadosPagamento.numero && !dadosPagamento.iban;

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-10">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-primary px-3 py-3 text-primary-foreground">
        <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="font-heading text-base font-bold">Pagar quota</p>
      </header>

      <div className="space-y-4 px-4 pt-4">
        <section className="card-suave p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-base font-bold text-foreground">{quota.referencia}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatData(quota.vencimento)} · {textoVencimento(quota.vencimento)}
              </p>
            </div>
            <EstadoBadge estado={quota.estado} />
          </div>
          <p className="mt-3 font-heading text-2xl font-extrabold text-primary">{formatKz(quota.valor)}</p>
        </section>

        <section className="card-suave divide-y divide-border/70">
          <p className="px-4 pb-3 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Dados para pagar
          </p>

          {semDadosBancarios ? (
            <p className="px-4 py-5 text-sm leading-relaxed text-muted-foreground">
              O tesoureiro ainda não configurou os dados do Multicaixa Express. Pede os dados de pagamento no grupo da
              empresa.
            </p>
          ) : (
            <>
              {dadosPagamento.numero && (
                <LinhaCopiar
                  rotulo="Multicaixa Express"
                  valor={dadosPagamento.numero}
                  copiado={copiado === 'numero'}
                  aoCopiar={() => copiar(dadosPagamento.numero, 'numero')}
                />
              )}
              {dadosPagamento.iban && (
                <LinhaCopiar
                  rotulo="IBAN"
                  valor={dadosPagamento.iban}
                  copiado={copiado === 'iban'}
                  aoCopiar={() => copiar(dadosPagamento.iban, 'iban')}
                />
              )}
              {dadosPagamento.titular && (
                <div className="px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Titular</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{dadosPagamento.titular}</p>
                </div>
              )}
              {dadosPagamento.nota && (
                <p className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">{dadosPagamento.nota}</p>
              )}
            </>
          )}
        </section>

        <section className="card-suave p-4">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Valor pago (Kz)
          </label>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            className="h-14 w-full rounded-2xl border border-input bg-white px-4 font-heading text-xl font-bold outline-none focus:border-primary"
          />

          <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Comprovativo (PDF)
          </p>

          <input
            ref={refFicheiro}
            type="file"
            accept="application/pdf,.pdf"
            onChange={escolherFicheiro}
            className="hidden"
          />

          {ficheiro ? (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3 ring-1 ring-border">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{ficheiro.name}</p>
                <p className="text-[11px] text-muted-foreground">{tamanhoLegivel(ficheiro.size)} · PDF verificado</p>
              </div>
              <button
                onClick={() => setFicheiro(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-muted-foreground ring-1 ring-border"
                aria-label="Remover comprovativo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => refFicheiro.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-white text-xs font-bold text-primary"
            >
              <Upload className="h-6 w-6" />
              Carregar comprovativo em PDF
            </button>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> Só PDF verdadeiro, entre 10 KB e 2 MB. O comprovativo é guardado de forma privada.
          </p>
        </section>

        <ErroCaixa mensagem={erro} />

        <button
          onClick={enviar}
          disabled={aEnviar || quota.estado === 'em_analise' || quota.estado === 'paga'}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
        >
          {aEnviar && <Loader2 className="h-5 w-5 animate-spin" />}
          {quota.estado === 'paga'
            ? 'Quota já paga'
            : quota.estado === 'em_analise'
              ? 'Pagamento já em análise'
              : aEnviar
                ? 'A enviar…'
                : 'Enviar comprovativo'}
        </button>
      </div>
    </div>
  );
}

function LinhaCopiar({ rotulo, valor, copiado, aoCopiar }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</p>
        <p className="truncate font-heading text-sm font-bold text-foreground">{valor}</p>
      </div>
      <button
        onClick={aoCopiar}
        className="flex shrink-0 items-center gap-1 rounded-xl bg-primary/5 px-3 py-2 text-[11px] font-bold text-primary"
      >
        {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}