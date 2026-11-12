import { useState } from 'react';
import SEO from '@/components/SEO';
import { Camera, CheckCircle2, CreditCard, KeyRound } from 'lucide-react';
import CartaoScript from '@/components/admin/CartaoScript';
import { lerDadosPagamento, guardarDadosPagamento } from '@/lib/configPagamento';
import { SQL_AUTENTICACAO } from '@/lib/sqlAuth';
import { SQL_PERFIS } from '@/lib/sqlPerfis';
import { getLigacao } from '@/lib/supabaseConfig';

function linkSqlEditor() {
  const { url } = getLigacao();
  const referencia = String(url || '').match(/https?:\/\/([^.]+)\.supabase\.co/);
  return referencia ? `https://supabase.com/dashboard/project/${referencia[1]}/sql/new` : 'https://supabase.com/dashboard';
}

export default function Configuracoes() {
  <SEO title="QuotaMob | Configurações de pagamento" description="Configure os dados e as instruções de pagamento apresentados aos motoristas na plataforma QuotaMob." />
  const [dados, setDados] = useState(lerDadosPagamento());
  const [guardado, setGuardado] = useState(false);

  function alterar(campo, valor) {
    setDados((anteriores) => ({ ...anteriores, [campo]: valor }));
    setGuardado(false);
  }

  function gravar() {
    guardarDadosPagamento(dados);
    setGuardado(true);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Dados de pagamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estes dados aparecem ao motorista quando abre o ecrã de pagamento.
        </p>
      </div>

      <div className="card-suave space-y-3 p-4">
        <div className="flex items-center gap-2 text-primary">
          <CreditCard className="h-4 w-4" />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Multicaixa Express</p>
        </div>

        {[
          { campo: 'numero', rotulo: 'Número ou conta Multicaixa', exemplo: '923 456 789' },
          { campo: 'iban', rotulo: 'IBAN', exemplo: 'AO06 0000 0000 0000 0000 0' },
          { campo: 'titular', rotulo: 'Titular da conta', exemplo: 'Cooperativa de Motoristas' },
        ].map(({ campo, rotulo, exemplo }) => (
          <label key={campo} className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</span>
            <input
              value={dados[campo]}
              onChange={(e) => alterar(campo, e.target.value)}
              placeholder={exemplo}
              className="h-12 w-full rounded-2xl border border-input px-3 text-sm outline-none focus:border-primary"
            />
          </label>
        ))}

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Instruções para o motorista
          </span>
          <textarea
            value={dados.nota}
            onChange={(e) => alterar('nota', e.target.value)}
            rows={3}
            placeholder="Ex.: paga a quota semanal até sexta-feira e envia o comprovativo nesta app."
            className="w-full rounded-2xl border border-input p-3 text-sm outline-none focus:border-primary"
          />
        </label>

        {guardado && (
          <p className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" /> Dados guardados neste dispositivo.
          </p>
        )}

        <button
          onClick={gravar}
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground"
        >
          Guardar dados
        </button>
      </div>

      <CartaoScript
        icone={KeyRound}
        titulo="Reposição automática"
        texto="Liga uma só vez a reposição automática de palavras-passe: o motorista escolhe a nova e ela fica ativa, sem passar por ti."
        script={SQL_AUTENTICACAO}
        destino={linkSqlEditor()}
      />

      <CartaoScript
        icone={Camera}
        titulo="Fotografias de perfil"
        texto="Liga as fotografias: cada motorista e cada tesoureiro passa a poder pôr a sua no perfil. Corre este script uma vez."
        script={SQL_PERFIS}
        destino={linkSqlEditor()}
      />
    </div>
  );
}