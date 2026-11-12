import React, { useState } from 'react';
import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  Mail,
  Phone,
  PlusCircle,
  Power,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { db } from '../db/database';
import { Motorista, Pagamento, Quota, User as AppUser } from '../types';
import { formatDate, formatMoney, getPaymentMethodLabel, getQuotaStatusLabel } from '../utils/formatters';

interface DriverDetailsModalProps {
  motorista: Motorista;
  currentUser: AppUser;
  onClose: () => void;
  onEdit: (motorista: Motorista) => void;
  onPayQuota: (quotaId: string) => void;
  onViewReceipt: (pagamento: Pagamento) => void;
  onCreateQuotaForDriver: (motoristaId: string) => void;
  onStatusChanged: () => void;
}

export const DriverDetailsModal: React.FC<DriverDetailsModalProps> = ({
  motorista,
  currentUser,
  onClose,
  onEdit,
  onPayQuota,
  onViewReceipt,
  onCreateQuotaForDriver,
  onStatusChanged,
}) => {
  const config = db.getConfig();
  const [activeTab, setActiveTab] = useState<'quotas' | 'pagamentos'>('quotas');

  const quotas = db.getQuotas({ motorista_id: motorista.id });
  const pagamentos = db.getPagamentos({ motorista_id: motorista.id });

  const totalQuotasPrevistas = quotas.reduce((acc, q) => acc + q.valor_total, 0);
  const totalPago = pagamentos
    .filter((p) => p.estado === 'confirmado')
    .reduce((acc, p) => acc + p.valor, 0);
  const totalDividas = quotas
    .filter((q) => q.estado === 'vencida')
    .reduce((acc, q) => acc + q.saldo_pendente, 0);
  const totalPendente = quotas
    .filter((q) => q.estado === 'pendente' || q.estado === 'parcialmente_paga')
    .reduce((acc, q) => acc + q.saldo_pendente, 0);

  const handleToggleStatus = () => {
    db.toggleMotoristaStatus(motorista.id, {
      id: currentUser.id,
      nome: currentUser.nome,
    });
    onStatusChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base shrink-0">
              {motorista.codigo_motorista}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {motorista.nome_completo}
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    motorista.estado === 'ativo'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {motorista.estado === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                BI: <span className="font-mono">{motorista.bi_identificacao}</span> · Admissão: {formatDate(motorista.data_admissao)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(motorista)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={handleToggleStatus}
              title={motorista.estado === 'ativo' ? 'Desativar motorista' : 'Ativar motorista'}
              className={`p-1.5 rounded-lg border transition-colors ${
                motorista.estado === 'ativo'
                  ? 'text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40'
                  : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Driver Contact & Vehicle Info strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
              Telefone
            </span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              {motorista.telefone}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
              Viatura
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 truncate">
              <Car className="w-3 h-3 text-slate-400 shrink-0" />
              {motorista.viatura_marca_modelo}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
              Matrícula
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
              {motorista.matricula}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
              Cor / Ano
            </span>
            <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">
              {motorista.cor_viatura} ({motorista.ano_fabrico})
            </span>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Quotas</span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5 block">
              {formatMoney(totalQuotasPrevistas, config.moeda_simbolo)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">Total Liquidado</span>
            <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300 mt-0.5 block">
              {formatMoney(totalPago, config.moeda_simbolo)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60">
            <span className="text-[11px] text-amber-700 dark:text-amber-400 block">Saldo a Vencer</span>
            <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-300 mt-0.5 block">
              {formatMoney(totalPendente, config.moeda_simbolo)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60">
            <span className="text-[11px] text-rose-700 dark:text-rose-400 block">Dívidas em Atraso</span>
            <span className="font-mono font-bold text-sm text-rose-700 dark:text-rose-300 mt-0.5 block">
              {formatMoney(totalDividas, config.moeda_simbolo)}
            </span>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveTab('quotas')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'quotas'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Quotas Atribuídas ({quotas.length})
              </button>
              <button
                onClick={() => setActiveTab('pagamentos')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'pagamentos'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Histórico de Pagamentos ({pagamentos.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onCreateQuotaForDriver(motorista.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Nova Quota
              </button>
            </div>
          </div>

          {/* TAB 1: Quotas */}
          {activeTab === 'quotas' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Título / Período</th>
                    <th className="py-2.5 px-3">Vencimento</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Pago</th>
                    <th className="py-2.5 px-3 text-right">Saldo</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quotas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Nenhuma quota registada para este motorista.
                      </td>
                    </tr>
                  ) : (
                    quotas.map((q) => {
                      const st = getQuotaStatusLabel(q.estado);
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {q.titulo}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ref: {q.referencia_periodo}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {formatDate(q.data_vencimento)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatMoney(q.valor_total, config.moeda_simbolo)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {formatMoney(q.valor_pago, config.moeda_simbolo)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {formatMoney(q.saldo_pendente, config.moeda_simbolo)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${st.bgClass} ${st.textClass}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {q.saldo_pendente > 0 ? (
                              <button
                                onClick={() => onPayQuota(q.id)}
                                className="px-2 py-1 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                              >
                                Pagar
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Liquidada
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Pagamentos */}
          {activeTab === 'pagamentos' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Recibo</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Método / Ref</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-right">Recibo Oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagamentos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Nenhum pagamento efetuado até o momento.
                      </td>
                    </tr>
                  ) : (
                    pagamentos.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 dark:text-blue-400">
                          {p.numero_recibo}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {formatDate(p.data_pagamento)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          <span>{getPaymentMethodLabel(p.metodo_pagamento)}</span>
                          {p.referencia_transacao && (
                            <span className="block font-mono text-[10px] text-slate-400">
                              {p.referencia_transacao}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatMoney(p.valor, config.moeda_simbolo)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.estado === 'confirmado'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : p.estado === 'pendente'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {p.estado === 'confirmado' ? 'Confirmado' : p.estado === 'pendente' ? 'Pendente' : 'Rejeitado'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {p.estado === 'confirmado' && (
                            <button
                              onClick={() => onViewReceipt(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 transition-colors"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              Ver Recibo
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
