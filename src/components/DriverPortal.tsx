import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  KeyRound,
  Phone,
  PlusCircle,
  Send,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react';
import { db } from '../db/database';
import { Motorista, Pagamento, Quota, User as AppUser } from '../types';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getPaymentMethodLabel,
  getQuotaStatusLabel,
} from '../utils/formatters';
import { ReceiptModal } from './ReceiptModal';
import { SubmitProofModal } from './SubmitProofModal';

interface DriverPortalProps {
  currentUser: AppUser;
  onRefreshData: () => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({ currentUser, onRefreshData }) => {
  const config = db.getConfig();
  const motorista = db.getMotoristaById(currentUser.motorista_id || '') || db.getMotoristas()[0];

  type DriverTab = 'dashboard' | 'quotas' | 'pagamentos' | 'notificacoes' | 'perfil';
  const [activeTab, setActiveTab] = useState<DriverTab>('dashboard');

  const [selectedPagamentoForReceipt, setSelectedPagamentoForReceipt] = useState<Pagamento | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [targetQuotaIdForSubmit, setTargetQuotaIdForSubmit] = useState<string | undefined>(undefined);

  // Profile edit states
  const [phoneInput, setPhoneInput] = useState<string>(motorista?.telefone || '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string>('');
  const [profileErrorMsg, setProfileErrorMsg] = useState<string>('');

  if (!motorista) {
    return (
      <div className="p-8 text-center text-slate-500">
        Perfil de motorista não associado a esta conta.
      </div>
    );
  }

  const quotas = db.getQuotas({ motorista_id: motorista.id });
  const pagamentos = db.getPagamentos({ motorista_id: motorista.id });
  const notificacoes = db.getNotificacoes(motorista.id);
  const unreadNotifsCount = notificacoes.filter((n) => !n.lida).length;

  const totalQuotasPrevistas = quotas.reduce((acc, q) => acc + q.valor_total, 0);
  const totalPagoConfirmado = pagamentos
    .filter((p) => p.estado === 'confirmado')
    .reduce((acc, p) => acc + p.valor, 0);

  const totalDividasVencidas = quotas
    .filter((q) => q.estado === 'vencida')
    .reduce((acc, q) => acc + q.saldo_pendente, 0);

  const totalPendente = quotas
    .filter((q) => q.estado === 'pendente' || q.estado === 'parcialmente_paga')
    .reduce((acc, q) => acc + q.saldo_pendente, 0);

  // Next due quota
  const upcomingQuotas = quotas
    .filter((q) => q.saldo_pendente > 0)
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  const proximaQuota = upcomingQuotas[0];

  const situacaoConta = totalDividasVencidas > 0 ? 'em_atraso' : 'regular';

  const handleOpenSubmit = (quotaId?: string) => {
    setTargetQuotaIdForSubmit(quotaId);
    setIsSubmitModalOpen(true);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setProfileErrorMsg('As palavras-passe não coincidem.');
      return;
    }

    db.updateMotorista(
      motorista.id,
      { telefone: phoneInput.trim() },
      { id: currentUser.id, nome: currentUser.nome }
    );

    if (newPassword) {
      db.updateUserPassword(currentUser.id, newPassword, {
        id: currentUser.id,
        nome: currentUser.nome,
      });
      setNewPassword('');
      setConfirmPassword('');
    }

    setProfileSuccessMsg('Dados do perfil atualizados com sucesso!');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Driver Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {motorista.codigo_motorista}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Olá, {motorista.nome_completo}
                </h1>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    situacaoConta === 'regular'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {situacaoConta === 'regular' ? 'Situação Regularizada' : 'Quotas em Atraso'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Viatura: <strong>{motorista.viatura_marca_modelo}</strong></span>
                <span>·</span>
                <span>Matrícula: <strong className="font-mono text-slate-800 dark:text-slate-200">{motorista.matricula}</strong></span>
                <span>·</span>
                <span>BI: <strong className="font-mono">{motorista.bi_identificacao}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => handleOpenSubmit()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4" />
              Submeter Comprovativo
            </button>
          </div>
        </div>

        {/* Tab Navigation for Driver */}
        <div className="flex items-center gap-1 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Início
          </button>
          <button
            onClick={() => setActiveTab('quotas')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'quotas'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Minhas Quotas ({quotas.length})
          </button>
          <button
            onClick={() => setActiveTab('pagamentos')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'pagamentos'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Meus Pagamentos ({pagamentos.length})
          </button>
          <button
            onClick={() => setActiveTab('notificacoes')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors relative ${
              activeTab === 'notificacoes'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Notificações
            {unreadNotifsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                {unreadNotifsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('perfil')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'perfil'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Meu Perfil
          </button>
        </div>
      </div>

      {/* TAB: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Overdue alert banner if exists */}
          {totalDividasVencidas > 0 && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm">Atenção: Quotas Vencidas em Atraso</h4>
                <p className="mt-0.5">
                  Você possui um saldo vencido de <strong>{formatMoney(totalDividasVencidas, config.moeda_simbolo)}</strong>. Evite restrições operacionais regularizando as quotas em aberto através de Multicaixa Express ({config.multicaixa_express_numero}) ou na secretaria.
                </p>
                <button
                  onClick={() => handleOpenSubmit()}
                  className="mt-2.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Submeter Pagamento Agora
                </button>
              </div>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Total de Quotas
              </span>
              <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {formatMoney(totalQuotasPrevistas, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {quotas.length} obrigações emitidas
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">
                Valor Já Pago
              </span>
              <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {formatMoney(totalPagoConfirmado, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {pagamentos.filter((p) => p.estado === 'confirmado').length} pagamentos validados
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-amber-600 dark:text-amber-400 block font-medium">
                Saldo a Vencer
              </span>
              <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                {formatMoney(totalPendente, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dentro do prazo regulamentar
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-rose-600 dark:text-rose-400 block font-medium">
                Quotas Vencidas / Dívida
              </span>
              <span className="text-lg font-mono font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                {formatMoney(totalDividasVencidas, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {quotas.filter((q) => q.estado === 'vencida').length} quotas em atraso
              </span>
            </div>
          </div>

          {/* Próximo Vencimento & Coordenadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Próximo Vencimento Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Próxima Quota a Vencer
                </h3>
                {proximaQuota && (
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                    Vence em {formatDate(proximaQuota.data_vencimento)}
                  </span>
                )}
              </div>

              {proximaQuota ? (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {proximaQuota.titulo}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ref: {proximaQuota.referencia_periodo}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                      {formatMoney(proximaQuota.saldo_pendente, config.moeda_simbolo)}
                    </span>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleOpenSubmit(proximaQuota.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                    >
                      Pagar esta Quota
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  Parabéns! Não existem quotas pendentes no momento. Todas as suas quotas estão 100% liquidadas.
                </div>
              )}
            </div>

            {/* Informações Bancárias Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Coordenadas de Pagamento {config.sigla}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Multicaixa Express (Número de Pagamento)</span>
                  <span className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                    {config.multicaixa_express_numero}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">IBAN Oficial da Associação</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block break-all">
                    {config.iban}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Titular: {config.titular_conta}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos Pagamentos Efetuados */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Últimos Pagamentos Registados
              </h3>
              <button
                onClick={() => setActiveTab('pagamentos')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Ver todos
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Recibo</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-right">Comprovativo / Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagamentos.slice(0, 3).map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 dark:text-blue-400">
                        {p.numero_recibo}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {formatDate(p.data_pagamento)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {getPaymentMethodLabel(p.metodo_pagamento)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatMoney(p.valor, config.moeda_simbolo)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.estado === 'confirmado'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : p.estado === 'pendente'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          }`}
                        >
                          {p.estado === 'confirmado' ? 'Confirmado' : p.estado === 'pendente' ? 'Pendente' : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.estado === 'confirmado' && (
                          <button
                            onClick={() => setSelectedPagamentoForReceipt(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            Recibo
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MINHAS QUOTAS */}
      {activeTab === 'quotas' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Quotas Atribuídas ao Motorista {motorista.codigo_motorista}
              </h2>
              <p className="text-xs text-slate-500">
                Consulte todas as suas quotas, prazos de vencimento, pagamentos parciais e saldos remanescentes.
              </p>
            </div>

            <button
              onClick={() => handleOpenSubmit()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors self-start sm:self-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              Submeter Comprovativo
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Quota / Período</th>
                  <th className="py-2.5 px-4">Data Emissão</th>
                  <th className="py-2.5 px-4">Data Vencimento</th>
                  <th className="py-2.5 px-4 text-right">Valor Total</th>
                  <th className="py-2.5 px-4 text-right">Valor Pago</th>
                  <th className="py-2.5 px-4 text-right">Saldo Aberto</th>
                  <th className="py-2.5 px-4 text-center">Estado</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quotas.map((q) => {
                  const st = getQuotaStatusLabel(q.estado);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {q.titulo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ref: {q.referencia_periodo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {formatDate(q.data_emissao)}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {formatDate(q.data_vencimento)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatMoney(q.valor_total, config.moeda_simbolo)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {formatMoney(q.valor_pago, config.moeda_simbolo)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatMoney(q.saldo_pendente, config.moeda_simbolo)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${st.bgClass} ${st.textClass}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {q.saldo_pendente > 0 ? (
                          <button
                            onClick={() => handleOpenSubmit(q.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs"
                          >
                            Pagar
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Liquidada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MEUS PAGAMENTOS */}
      {activeTab === 'pagamentos' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Histórico de Pagamentos e Recibos
              </h2>
              <p className="text-xs text-slate-500">
                Todos os pagamentos confirmados, pendentes de aprovação bancária e recibos oficiais emitidos.
              </p>
            </div>

            <button
              onClick={() => handleOpenSubmit()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors self-start sm:self-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              Submeter Novo Comprovativo
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Nº do Recibo</th>
                  <th className="py-2.5 px-4">Data Pagamento</th>
                  <th className="py-2.5 px-4">Método</th>
                  <th className="py-2.5 px-4">Referência / Transação</th>
                  <th className="py-2.5 px-4 text-right">Valor Pago</th>
                  <th className="py-2.5 px-4 text-center">Estado</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagamentos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum pagamento efetuado até ao momento.
                    </td>
                  </tr>
                ) : (
                  pagamentos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-700 dark:text-blue-400">
                        {p.numero_recibo}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {formatDate(p.data_pagamento)}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                        {getPaymentMethodLabel(p.metodo_pagamento)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {p.referencia_transacao || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatMoney(p.valor, config.moeda_simbolo)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.estado === 'confirmado'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : p.estado === 'pendente'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {p.estado === 'confirmado' ? 'Confirmado' : p.estado === 'pendente' ? 'Pendente de Confirmação' : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.estado === 'confirmado' && (
                          <button
                            onClick={() => setSelectedPagamentoForReceipt(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Recibo Oficial
                          </button>
                        )}
                        {p.estado === 'pendente' && (
                          <span className="text-[11px] text-slate-400 italic">
                            Aguardando validação
                          </span>
                        )}
                        {p.estado === 'rejeitado' && (
                          <span className="text-[11px] text-rose-500 font-medium">
                            {p.motivo_rejeicao || 'Não aprovado'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: NOTIFICAÇÕES */}
      {activeTab === 'notificacoes' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Minhas Notificações & Avisos da Administração
              </h2>
              <p className="text-xs text-slate-500">
                Alertas de novas quotas, avisos de vencimento e confirmações de pagamentos.
              </p>
            </div>

            <button
              onClick={() => {
                db.markAllNotificacoesRead(motorista.id);
                onRefreshData();
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Marcar todas como lidas
            </button>
          </div>

          <div className="space-y-3">
            {notificacoes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Nenhuma notificação no momento.
              </p>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    n.lida
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <Bell
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          n.tipo === 'atraso'
                            ? 'text-rose-500'
                            : n.tipo === 'pagamento_confirmado'
                            ? 'text-emerald-500'
                            : 'text-blue-500'
                        }`}
                      />
                      <div>
                        <h4 className="text-xs font-bold">{n.titulo}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {n.mensagem}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-2">
                          {formatDateTime(n.data_criacao)}
                        </span>
                      </div>
                    </div>

                    {!n.lida && (
                      <button
                        onClick={() => {
                          db.markNotificacaoRead(n.id);
                          onRefreshData();
                        }}
                        className="text-[11px] font-medium text-blue-600 hover:underline shrink-0"
                      >
                        Marcar lida
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: MEU PERFIL */}
      {activeTab === 'perfil' && (
        <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Dados Pessoais e Segurança
              </h2>
              <p className="text-xs text-slate-500">
                Consulte os dados cadastrais da sua viatura e atualize o seu contacto telefónico ou palavra-passe.
              </p>
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {/* Readonly info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Código de Motorista</label>
              <input
                type="text"
                disabled
                value={motorista.codigo_motorista}
                className="w-full font-mono font-bold px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nome Completo</label>
              <input
                type="text"
                disabled
                value={motorista.nome_completo}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Bilhete de Identidade (BI)</label>
              <input
                type="text"
                disabled
                value={motorista.bi_identificacao}
                className="w-full font-mono px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Viatura / Modelo</label>
              <input
                type="text"
                disabled
                value={motorista.viatura_marca_modelo}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Matrícula</label>
              <input
                type="text"
                disabled
                value={motorista.matricula}
                className="w-full font-mono font-bold px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Telefone de Contacto (Permitido alterar)
              </label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Change password */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Segurança da Conta (Alterar Palavra-Passe)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nova Palavra-Passe
                </label>
                <input
                  type="password"
                  placeholder="Deixe em branco para manter a atual"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Confirmar Nova Palavra-Passe
                </label>
                <input
                  type="password"
                  placeholder="Repita a nova palavra-passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Guardar Alterações
            </button>
          </div>
        </form>
      )}

      {/* MODAL: SUBMETER COMPROVATIVO */}
      {isSubmitModalOpen && (
        <SubmitProofModal
          motorista={motorista}
          currentUser={currentUser}
          initialQuotaId={targetQuotaIdForSubmit}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={() => {
            setIsSubmitModalOpen(false);
            onRefreshData();
          }}
        />
      )}

      {/* MODAL: RECIBO OFICIAL */}
      {selectedPagamentoForReceipt && (
        <ReceiptModal
          pagamento={selectedPagamentoForReceipt}
          onClose={() => setSelectedPagamentoForReceipt(null)}
        />
      )}
    </div>
  );
};
