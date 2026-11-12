import React from 'react';
import { CheckCircle2, Download, Printer, ShieldCheck, X } from 'lucide-react';
import { db } from '../db/database';
import { Motorista, Pagamento, Quota } from '../types';
import { formatDate, formatDateTime, formatMoney, getPaymentMethodLabel } from '../utils/formatters';

interface ReceiptModalProps {
  pagamento: Pagamento;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ pagamento, onClose }) => {
  const config = db.getConfig();
  const motorista = db.getMotoristaById(pagamento.motorista_id);
  const quota = db.getQuotaById(pagamento.quota_id);

  const handlePrint = () => {
    window.print();
  };

  const authHash = `TXG-${pagamento.id.slice(-6).toUpperCase()}-${pagamento.numero_recibo.replace(/[^A-Za-z0-9]/g, '')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Toolbar (hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Recibo Oficial de Pagamento
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-8 sm:p-10 font-sans text-slate-900 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-blue-900">
                  {config.sigla}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {config.nome_organizacao}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                NIF: <span className="font-mono">{config.nif}</span> · {config.endereco}
              </p>
              <p className="text-xs text-slate-500">
                Tel: {config.telefone} · E-mail: {config.email}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                RECIBO DE QUOTA
              </span>
              <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                {pagamento.numero_recibo}
              </p>
              <p className="text-xs text-slate-500">
                Emitido em: {formatDate(pagamento.data_validacao || pagamento.data_pagamento)}
              </p>
            </div>
          </div>

          {/* Driver & Vehicle Box */}
          <div className="my-6 p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                Beneficiário / Motorista
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {motorista?.nome_completo || 'Motorista não identificado'}
              </p>
              <p className="text-slate-600 mt-0.5">
                Cód: <span className="font-mono font-semibold text-blue-800">{motorista?.codigo_motorista}</span> · BI: {motorista?.bi_identificacao}
              </p>
              <p className="text-slate-600">
                Contacto: {motorista?.telefone}
              </p>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                Dados da Viatura
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {motorista?.viatura_marca_modelo}
              </p>
              <p className="text-slate-600 mt-0.5">
                Matrícula: <span className="font-mono font-semibold bg-white px-1.5 py-0.5 border border-slate-300 rounded text-slate-900">{motorista?.matricula}</span>
              </p>
              <p className="text-slate-600">
                Cor: {motorista?.cor_viatura} ({motorista?.ano_fabrico})
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Descrição da Operação</th>
                  <th className="py-2.5 px-4">Referência</th>
                  <th className="py-2.5 px-4">Método</th>
                  <th className="py-2.5 px-4 text-right">Valor Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">
                      {quota?.titulo || 'Quota de Associação'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Vencimento: {formatDate(quota?.data_vencimento || '')}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {pagamento.referencia_transacao || quota?.referencia_periodo || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {getPaymentMethodLabel(pagamento.metodo_pagamento)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm text-slate-900">
                    {formatMoney(pagamento.valor, config.moeda_simbolo)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total & Balances */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-blue-50/60 border border-blue-100 rounded-lg mb-6 gap-4">
            <div>
              <span className="text-xs text-blue-900 font-medium">Situação da Quota:</span>
              <div className="text-xs text-slate-600 mt-1">
                <span>Valor Total: <strong>{formatMoney(quota?.valor_total || 0, config.moeda_simbolo)}</strong></span> · 
                <span className="ml-1">Total Liquidado: <strong>{formatMoney(quota?.valor_pago || 0, config.moeda_simbolo)}</strong></span> · 
                <span className="ml-1">Saldo Remanescente: <strong className={quota && quota.saldo_pendente > 0 ? 'text-amber-700' : 'text-emerald-700'}>{formatMoney(quota?.saldo_pendente || 0, config.moeda_simbolo)}</strong></span>
              </div>
            </div>
            <div className="text-right sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium block">
                Total Recebido
              </span>
              <span className="text-xl font-extrabold font-mono text-blue-950">
                {formatMoney(pagamento.valor, config.moeda_simbolo)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {pagamento.observacoes && (
            <div className="mb-6 text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Observações: </span>
              {pagamento.observacoes}
            </div>
          )}

          {/* Authenticity & Signature Footer */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end text-xs text-slate-500">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Documento Autenticado e Válido</span>
              </div>
              <p className="font-mono text-[10px] text-slate-400">
                HASH DE VALIDAÇÃO: {authHash}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Validado por: {pagamento.validado_por || 'Sistema Central'} em {formatDateTime(pagamento.data_validacao || pagamento.created_at)}
              </p>
            </div>

            <div className="text-center sm:text-right">
              <div className="inline-block border-t border-slate-400 pt-2 px-8">
                <p className="text-xs font-semibold text-slate-800">Assinatura / Tesouraria</p>
                <p className="text-[10px] text-slate-500">{config.sigla} - Gestão Financeira</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden in print) */}
        <div className="no-print flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimir Recibo Oficial
          </button>
        </div>
      </div>
    </div>
  );
};
