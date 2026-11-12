import React, { useState } from 'react';
import { AlertCircle, Check, FileText, Upload, X } from 'lucide-react';
import { db } from '../db/database';
import { MetodoPagamento, Motorista, Quota, User } from '../types';
import { formatDate, formatMoney } from '../utils/formatters';

interface SubmitProofModalProps {
  motorista: Motorista;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  initialQuotaId?: string;
}

export const SubmitProofModal: React.FC<SubmitProofModalProps> = ({
  motorista,
  currentUser,
  onClose,
  onSuccess,
  initialQuotaId,
}) => {
  const config = db.getConfig();
  const quotas = db.getQuotas({ motorista_id: motorista.id }).filter((q) => q.saldo_pendente > 0);

  const [quotaId, setQuotaId] = useState<string>(initialQuotaId || (quotas[0]?.id ?? ''));
  const selectedQuota = db.getQuotaById(quotaId);

  const [valor, setValor] = useState<number>(selectedQuota?.saldo_pendente || config.valor_quota_padrao);
  const [dataPagamento, setDataPagamento] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState<MetodoPagamento>('multicaixa_express');
  const [referencia, setReferencia] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [comprovativoNome, setComprovativoNome] = useState<string>('');
  const [comprovativoUrl, setComprovativoUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleQuotaChange = (qId: string) => {
    setQuotaId(qId);
    const q = quotas.find((item) => item.id === qId);
    if (q) {
      setValor(q.saldo_pendente);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprovativoNome(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprovativoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!quotaId) {
      setError('Por favor, selecione a quota a liquidar.');
      return;
    }
    if (!valor || valor <= 0) {
      setError('O valor pago deve ser superior a zero.');
      return;
    }
    if (!referencia.trim() && !comprovativoNome) {
      setError('Insira o número de referência da transação ou anexe o comprovativo.');
      return;
    }

    try {
      setIsSubmitting(true);
      db.createPagamento(
        {
          motorista_id: motorista.id,
          quota_id: quotaId,
          valor: Number(valor),
          data_pagamento: dataPagamento,
          metodo_pagamento: metodo,
          referencia_transacao: referencia.trim() || undefined,
          observacoes: observacoes.trim() || 'Submetido pelo motorista através do painel pessoal.',
          comprovativo_nome: comprovativoNome || undefined,
          comprovativo_url: comprovativoUrl || undefined,
          estado: 'pendente',
        },
        {
          id: currentUser.id,
          nome: currentUser.nome,
          perfil: 'motorista',
        }
      );

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter comprovativo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Submeter Comprovativo de Pagamento
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Motorista: {motorista.nome_completo} ({motorista.codigo_motorista})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bank & MCX info reminder */}
        <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
          <p className="font-semibold">Coordenadas de Pagamento ATPL:</p>
          <p className="mt-0.5">
            <strong>Multicaixa Express:</strong> {config.multicaixa_express_numero} · <strong>IBAN:</strong> {config.iban}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Quota */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Selecione a Quota a Liquidar <span className="text-rose-500">*</span>
            </label>
            {quotas.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                Não existem quotas com saldo pendente no momento. Todas estão em dia!
              </p>
            ) : (
              <select
                value={quotaId}
                onChange={(e) => handleQuotaChange(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {quotas.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.titulo} — Saldo: {formatMoney(q.saldo_pendente, config.moeda_simbolo)} (Venc: {formatDate(q.data_vencimento)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Valor & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Pago ({config.moeda_simbolo}) <span className="text-rose-500">*</span>
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
                Forma de Pagamento <span className="text-rose-500">*</span>
              </label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as MetodoPagamento)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="multicaixa_express">Multicaixa Express</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="dinheiro">Dinheiro (Secretaria)</option>
                <option value="outro">Outro Método</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referência / ID Transação
              </label>
              <input
                type="text"
                placeholder="Ex: MCX-90123481"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Upload Comprovativo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Foto ou PDF do Comprovativo
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {comprovativoNome ? comprovativoNome : 'Carregar captura do ecrã ou talão'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Formatos aceites: JPG, PNG, PDF</p>
              <label className="mt-2 inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded cursor-pointer hover:bg-slate-200">
                Selecionar Ficheiro
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mensagem para a Administração (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Transferência feita através da conta BFA."
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
              Submeter Comprovativo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
