import React, { useState } from 'react';
import { AlertCircle, Calendar, Check, Layers, Plus, User, X } from 'lucide-react';
import { db } from '../db/database';
import { Motorista, PeriodicidadeQuota, User as AppUser } from '../types';
import { formatMoney } from '../utils/formatters';

interface CreateQuotaModalProps {
  currentUser: AppUser;
  initialMotoristaId?: string;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const CreateQuotaModal: React.FC<CreateQuotaModalProps> = ({
  currentUser,
  initialMotoristaId,
  onClose,
  onSuccess,
}) => {
  const config = db.getConfig();
  const motoristasAtivos = db.getMotoristas().filter((m) => m.estado === 'ativo');

  const [mode, setMode] = useState<'lote' | 'individual'>(initialMotoristaId ? 'individual' : 'lote');
  const [motoristaId, setMotoristaId] = useState<string>(initialMotoristaId || (motoristasAtivos[0]?.id ?? ''));
  const [periodicidade, setPeriodicidade] = useState<PeriodicidadeQuota>(config.periodicidade_padrao);
  
  // Calculate next week label
  const now = new Date();
  const currentWeek = 47; // e.g. Semana 47
  const year = now.getFullYear();

  const [titulo, setTitulo] = useState<string>(`Quota Semanal - Semana ${currentWeek}/${year}`);
  const [referenciaPeriodo, setReferenciaPeriodo] = useState<string>(`${year}-W${currentWeek}`);
  const [valorTotal, setValorTotal] = useState<number>(config.valor_quota_padrao);
  const [dataEmissao, setDataEmissao] = useState<string>(now.toISOString().split('T')[0]);
  
  // Default due date: +5 days
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 5);
  const [dataVencimento, setDataVencimento] = useState<string>(dueDate.toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!titulo.trim()) {
      setError('O título da quota é obrigatório.');
      return;
    }
    if (!referenciaPeriodo.trim()) {
      setError('A referência do período é obrigatória (ex: 2026-W47).');
      return;
    }
    if (!valorTotal || valorTotal <= 0) {
      setError('O valor total da quota deve ser superior a zero.');
      return;
    }
    if (dataVencimento < dataEmissao) {
      setError('A data de vencimento não pode ser anterior à data de emissão.');
      return;
    }

    try {
      const actor = { id: currentUser.id, nome: currentUser.nome };

      if (mode === 'lote') {
        const res = db.generateBatchQuotas(
          {
            titulo_base: titulo.trim(),
            referencia_periodo: referenciaPeriodo.trim(),
            valor_total: Number(valorTotal),
            data_emissao: dataEmissao,
            data_vencimento: dataVencimento,
            observacoes: observacoes.trim() || undefined,
          },
          actor
        );
        onSuccess(res.count);
      } else {
        if (!motoristaId) {
          setError('Selecione o motorista para atribuir a quota individual.');
          return;
        }
        db.createQuota(
          {
            motorista_id: motoristaId,
            titulo: titulo.trim(),
            referencia_periodo: referenciaPeriodo.trim(),
            valor_total: Number(valorTotal),
            data_emissao: dataEmissao,
            data_vencimento: dataVencimento,
            observacoes: observacoes.trim() || undefined,
          },
          actor
        );
        onSuccess(1);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar quotas.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Emitir Novas Quotas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('lote')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'lote'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Em Lote ({motoristasAtivos.length} Motoristas Ativos)
            </button>
            <button
              type="button"
              onClick={() => setMode('individual')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'individual'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Quota Individual
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'individual' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motorista Destinatário <span className="text-rose-500">*</span>
              </label>
              <select
                value={motoristaId}
                onChange={(e) => setMotoristaId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {motoristasAtivos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo_motorista} - {m.nome_completo} ({m.matricula})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Periodicidade & Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Periodicidade
              </label>
              <select
                value={periodicidade}
                onChange={(e) => setPeriodicidade(e.target.value as PeriodicidadeQuota)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referência do Período <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={referenciaPeriodo}
                onChange={(e) => setReferenciaPeriodo(e.target.value)}
                placeholder="Ex: 2026-W47 ou 2026-11"
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Título & Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Título da Quota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Total ({config.moeda_simbolo}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                value={valorTotal}
                onChange={(e) => setValorTotal(Number(e.target.value))}
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Vencimento <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Instruções
            </label>
            <input
              type="text"
              placeholder="Ex: Quota regulamentar para fundo cooperativo de táxis."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notice info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
            {mode === 'lote' ? (
              <p>
                Serão emitidas <strong>{motoristasAtivos.length} quotas individuais</strong> de {formatMoney(valorTotal, config.moeda_simbolo)} para todos os motoristas ativos. Motoristas receberão notificação automática no seu painel.
              </p>
            ) : (
              <p>
                Será gerada uma quota individual no valor de {formatMoney(valorTotal, config.moeda_simbolo)} atribuída exclusivamente ao motorista selecionado.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              {mode === 'lote' ? `Emitir para ${motoristasAtivos.length} Motoristas` : 'Emitir Quota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
