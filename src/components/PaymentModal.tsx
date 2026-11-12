import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, DollarSign, Upload, X } from 'lucide-react';
import { db } from '../db/database';
import { MetodoPagamento, Motorista, Quota, User } from '../types';
import { formatDate, formatMoney } from '../utils/formatters';

interface PaymentModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: (pagamentoId: string) => void;
  initialMotoristaId?: string;
  initialQuotaId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
  initialMotoristaId,
  initialQuotaId,
}) => {
  const config = db.getConfig();
  const motoristas = db.getMotoristas().filter((m) => m.estado === 'ativo');

  const [motoristaId, setMotoristaId] = useState<string>(initialMotoristaId || (motoristas[0]?.id ?? ''));
  const [quotaId, setQuotaId] = useState<string>(initialQuotaId || '');
  const [valor, setValor] = useState<number>(0);
  const [dataPagamento, setDataPagamento] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState<MetodoPagamento>('multicaixa_express');
  const [referencia, setReferencia] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [comprovativoNome, setComprovativoNome] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter open quotas for chosen driver
  const availableQuotas = db.getQuotas({ motorista_id: motoristaId }).filter(
    (q) => q.saldo_pendente > 0 || q.id === initialQuotaId
  );

  useEffect(() => {
    if (availableQuotas.length > 0) {
      if (!quotaId || !availableQuotas.some((q) => q.id === quotaId)) {
        setQuotaId(availableQuotas[0].id);
        setValor(availableQuotas[0].saldo_pendente);
      }
    } else {
      setQuotaId('');
      setValor(0);
    }
  }, [motoristaId]);

  useEffect(() => {
    const selectedQ = availableQuotas.find((q) => q.id === quotaId);
    if (selectedQ) {
      setValor(selectedQ.saldo_pendente);
    }
  }, [quotaId]);

  const selectedQuota = db.getQuotaById(quotaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!motoristaId) {
      setError('Por favor, selecione um motorista.');
      return;
    }
    if (!quotaId) {
      setError('Por favor, selecione uma quota com saldo pendente.');
      return;
    }
    if (!valor || valor <= 0) {
      setError('O valor do pagamento deve ser superior a zero.');
      return;
    }
    if (selectedQuota && valor > selectedQuota.saldo_pendente) {
      setError(`O valor inserido (${formatMoney(valor, config.moeda_simbolo)}) é superior ao saldo pendente da quota (${formatMoney(selectedQuota.saldo_pendente, config.moeda_simbolo)}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      const novoPagamento = db.createPagamento(
        {
          motorista_id: motoristaId,
          quota_id: quotaId,
          valor: Number(valor),
          data_pagamento: dataPagamento,
          metodo_pagamento: metodo,
          referencia_transacao: referencia.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
          comprovativo_nome: comprovativoNome || undefined,
          estado: 'confirmado',
        },
        {
          id: currentUser.id,
          nome: currentUser.nome,
          perfil: currentUser.perfil,
        }
      );

      onSuccess(novoPagamento.id);
    } catch (err: any) {
      setError(err.message || 'Erro ao registar o pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprovativoNome(file.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Registar Pagamento de Quota
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Motorista Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motorista <span className="text-rose-500">*</span>
            </label>
            <select
              value={motoristaId}
              onChange={(e) => setMotoristaId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {motoristas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo_motorista} - {m.nome_completo} ({m.matricula})
                </option>
              ))}
            </select>
          </div>

          {/* Quota Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quota a Liquidar <span className="text-rose-500">*</span>
            </label>
            {availableQuotas.length === 0 ? (
              <div className="p-3 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-lg">
                Este motorista não possui quotas pendentes em aberto.
              </div>
            ) : (
              <select
                value={quotaId}
                onChange={(e) => setQuotaId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {availableQuotas.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.titulo} (Saldo: {formatMoney(q.saldo_pendente, config.moeda_simbolo)} - Venc: {formatDate(q.data_vencimento)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quota Info Box */}
          {selectedQuota && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Total da Quota:</span>
                <span className="ml-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatMoney(selectedQuota.valor_total, config.moeda_simbolo)}
                </span>
                <div className="text-[11px] text-slate-500">
                  Já pago: {formatMoney(selectedQuota.valor_pago, config.moeda_simbolo)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-slate-400">Saldo Pendente:</span>
                <span className="block font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                  {formatMoney(selectedQuota.saldo_pendente, config.moeda_simbolo)}
                </span>
              </div>
            </div>
          )}

          {/* Valor & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Recebido ({config.moeda_simbolo}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400">Permite pagamento parcial ou total.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Pagamento <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Método & Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Método de Pagamento <span className="text-rose-500">*</span>
              </label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as MetodoPagamento)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="multicaixa_express">Multicaixa Express</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="dinheiro">Dinheiro (Espécie)</option>
                <option value="outro">Outro Método</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referência / Nº Transação
              </label>
              <input
                type="text"
                placeholder="Ex: MCX-98231024"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Comprovativo / Anexo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Anexar Comprovativo (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs text-slate-700 dark:text-slate-300">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Escolher ficheiro</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleSimulateFile}
                />
              </label>
              {comprovativoNome && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-xs">
                  {comprovativoNome}
                </span>
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Notas Internas
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Entrega de numerário na tesouraria da sede."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              disabled={isSubmitting || !quotaId}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              Confirmar Pagamento e Emitir Recibo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
