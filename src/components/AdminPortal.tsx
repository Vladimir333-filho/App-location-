import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit2,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Phone,
  Plus,
  PlusCircle,
  Power,
  Search,
  Send,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { db } from '../db/database';
import {
  MetodoPagamento,
  Motorista,
  Pagamento,
  Quota,
  QuotaStatus,
  User as AppUser,
} from '../types';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getPaymentMethodLabel,
  getQuotaStatusLabel,
} from '../utils/formatters';
import { CreateQuotaModal } from './CreateQuotaModal';
import { DriverDetailsModal } from './DriverDetailsModal';
import { DriverModal } from './DriverModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { ReportsView } from './ReportsView';
import { SettingsView } from './SettingsView';

interface AdminPortalProps {
  currentUser: AppUser;
  activeNavTab: string;
  onNavigateTab: (tab: string) => void;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  activeNavTab,
  onNavigateTab,
  onRefreshData,
}) => {
  const config = db.getConfig();
  const motoristas = db.getMotoristas();
  const quotas = db.getQuotas();
  const pagamentos = db.getPagamentos();
  const devedores = db.getDevedores();
  const stats = db.getFinancialStats();

  // Modals state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState<boolean>(false);
  const [driverToEdit, setDriverToEdit] = useState<Motorista | undefined>(undefined);
  const [viewingDriver, setViewingDriver] = useState<Motorista | undefined>(undefined);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentInitialMotoristaId, setPaymentInitialMotoristaId] = useState<string | undefined>(undefined);
  const [paymentInitialQuotaId, setPaymentInitialQuotaId] = useState<string | undefined>(undefined);

  const [isCreateQuotaModalOpen, setIsCreateQuotaModalOpen] = useState<boolean>(false);
  const [quotaInitialMotoristaId, setQuotaInitialMotoristaId] = useState<string | undefined>(undefined);

  const [receiptToView, setReceiptToView] = useState<Pagamento | null>(null);

  // Search & Filter states
  const [driverSearch, setDriverSearch] = useState<string>('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [quotaStatusFilter, setQuotaStatusFilter] = useState<string>('todos');
  const [quotaDriverFilter, setQuotaDriverFilter] = useState<string>('todos');
  const [quotaSearch, setQuotaSearch] = useState<string>('');

  const [paymentStatusTab, setPaymentStatusTab] = useState<'todos' | 'pendentes' | 'confirmados'>('todos');
  const [paymentSearch, setPaymentSearch] = useState<string>('');

  // Notification broadcast modal / state
  const [isSendNotifOpen, setIsSendNotifOpen] = useState<boolean>(false);
  const [notifTarget, setNotifTarget] = useState<string>('todos');
  const [notifTitulo, setNotifTitulo] = useState<string>('');
  const [notifMensagem, setNotifMensagem] = useState<string>('');
  const [notifTipo, setNotifTipo] = useState<'comunicado' | 'atraso'>('comunicado');
  const [notifFeedback, setNotifFeedback] = useState<string>('');

  // Rejection modal
  const [rejectingPayment, setRejectingPayment] = useState<Pagamento | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState<string>('Comprovativo ilegível ou referência não encontrada no extrato.');

  // Handlers for payments
  const handleApprovePayment = (paymentId: string) => {
    const updated = db.confirmPayment(paymentId, {
      id: currentUser.id,
      nome: currentUser.nome,
    });
    if (updated) {
      setReceiptToView(updated);
      onRefreshData();
    }
  };

  const handleConfirmReject = () => {
    if (rejectingPayment) {
      db.rejectPayment(rejectingPayment.id, rejectMotivo, {
        id: currentUser.id,
        nome: currentUser.nome,
      });
      setRejectingPayment(null);
      onRefreshData();
    }
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitulo.trim() || !notifMensagem.trim()) return;

    db.sendNotification({
      destinatario_id: notifTarget,
      tipo: notifTipo,
      titulo: notifTitulo.trim(),
      mensagem: notifMensagem.trim(),
    });

    db.logAudit({
      utilizador_id: currentUser.id,
      utilizador_nome: currentUser.nome,
      acao: 'Envio de Notificação / Comunicado',
      entidade: 'configuracao',
      detalhes: `Notificação "${notifTitulo}" enviada para ${notifTarget === 'todos' ? 'todos os motoristas' : notifTarget}.`,
    });

    setNotifFeedback('Notificação enviada com sucesso!');
    setNotifTitulo('');
    setNotifMensagem('');
    setTimeout(() => {
      setNotifFeedback('');
      setIsSendNotifOpen(false);
    }, 2000);
    onRefreshData();
  };

  // Filtered drivers list
  const filteredMotoristas = motoristas.filter((m) => {
    if (driverStatusFilter !== 'todos' && m.estado !== driverStatusFilter) return false;
    if (driverSearch.trim()) {
      const q = driverSearch.toLowerCase();
      return (
        m.nome_completo.toLowerCase().includes(q) ||
        m.codigo_motorista.toLowerCase().includes(q) ||
        m.matricula.toLowerCase().includes(q) ||
        m.telefone.toLowerCase().includes(q) ||
        m.bi_identificacao.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered quotas list
  const filteredQuotas = quotas.filter((q) => {
    if (quotaStatusFilter !== 'todos' && q.estado !== quotaStatusFilter) return false;
    if (quotaDriverFilter !== 'todos' && q.motorista_id !== quotaDriverFilter) return false;
    if (quotaSearch.trim()) {
      const term = quotaSearch.toLowerCase();
      const mot = motoristas.find((m) => m.id === q.motorista_id);
      return (
        q.titulo.toLowerCase().includes(term) ||
        q.referencia_periodo.toLowerCase().includes(term) ||
        (mot && mot.nome_completo.toLowerCase().includes(term)) ||
        (mot && mot.codigo_motorista.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // Filtered payments list
  const filteredPagamentos = pagamentos.filter((p) => {
    if (paymentStatusTab === 'pendentes' && p.estado !== 'pendente') return false;
    if (paymentStatusTab === 'confirmados' && p.estado !== 'confirmado') return false;
    if (paymentSearch.trim()) {
      const term = paymentSearch.toLowerCase();
      const mot = motoristas.find((m) => m.id === p.motorista_id);
      return (
        p.numero_recibo.toLowerCase().includes(term) ||
        (p.referencia_transacao && p.referencia_transacao.toLowerCase().includes(term)) ||
        (mot && mot.nome_completo.toLowerCase().includes(term)) ||
        (mot && mot.codigo_motorista.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const pendingPayments = pagamentos.filter((p) => p.estado === 'pendente');

  return (
    <div className="space-y-6">
      {/* Pending Validation Alert Bar (if any driver uploaded proof) */}
      {pendingPayments.length > 0 && activeNavTab !== 'pagamentos' && (
        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Existem <strong>{pendingPayments.length} comprovativo(s) de pagamento pendente(s)</strong> de validação enviados por motoristas.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('pagamentos')}
            className="px-3 py-1.5 font-semibold text-xs text-amber-900 dark:text-amber-100 bg-amber-200/80 dark:bg-amber-800 rounded-lg hover:bg-amber-300 transition-colors"
          >
            Verificar Agora
          </button>
        </div>
      )}

      {/* VIEW: DASHBOARD */}
      {activeNavTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Actions Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Painel Geral da Organização de Táxis
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhamento em tempo real das quotas, arrecadação financeira e situação dos motoristas.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setPaymentInitialMotoristaId(undefined);
                  setPaymentInitialQuotaId(undefined);
                  setIsPaymentModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                <DollarSign className="w-4 h-4" />
                Registar Pagamento
              </button>
              <button
                onClick={() => {
                  setQuotaInitialMotoristaId(undefined);
                  setIsCreateQuotaModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                Emitir Quotas em Lote
              </button>
              <button
                onClick={() => {
                  setDriverToEdit(undefined);
                  setIsDriverModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Novo Motorista
              </button>
            </div>
          </div>

          {/* 8 Primary Financial & Operational KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Motoristas */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Total de Motoristas
              </span>
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {stats.totalMotoristas}
              </span>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {stats.motoristasAtivos} ativos
                </span>
                <span>·</span>
                <span>{stats.motoristasInativos} inativos</span>
              </div>
            </div>

            {/* Quotas Previstas */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Quotas Previstas (Total)
              </span>
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {formatMoney(stats.totalQuotasPrevistas, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {quotas.length} obrigações emitidas
              </span>
            </div>

            {/* Total Recebido */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block">
                Total Arrecadado
              </span>
              <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {formatMoney(stats.totalRecebido, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-emerald-600/80 mt-1 block">
                Taxa de liquidação: {stats.totalQuotasPrevistas > 0 ? Math.round((stats.totalRecebido / stats.totalQuotasPrevistas) * 100) : 0}%
              </span>
            </div>

            {/* Total Dívidas Vencidas */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium block">
                Dívidas em Atraso
              </span>
              <span className="text-xl font-mono font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                {formatMoney(stats.totalDividas, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-rose-600/80 mt-1 block">
                {stats.motoristasEmAtrasoCount} motoristas em mora
              </span>
            </div>

            {/* Recebido Hoje */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Arrecadação Hoje
              </span>
              <span className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                {formatMoney(stats.recebidoHoje, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Entradas validadas hoje
              </span>
            </div>

            {/* Recebido Este Mês */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Arrecadação Este Mês
              </span>
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {formatMoney(stats.recebidoMes, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Mês corrente ({new Date().toLocaleDateString('pt-AO', { month: 'long' })})
              </span>
            </div>

            {/* Saldo a Vencer */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block">
                Valores Pendentes
              </span>
              <span className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                {formatMoney(stats.totalPendente, config.moeda_simbolo)}
              </span>
              <span className="text-[11px] text-amber-600/80 mt-1 block">
                A vencer nos próximos dias
              </span>
            </div>

            {/* Pendentes de Validação */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium block">
                Comprovativos Aguardando
              </span>
              <span className="text-xl font-mono font-bold text-purple-600 dark:text-purple-400 mt-1 block">
                {stats.pagamentosPendentesCount}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Necessitam validação da tesouraria
              </span>
            </div>
          </div>

          {/* Pending Proofs & Critical Debtors Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comprovativos Submetidos por Motoristas (Aprovar / Rejeitar) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Comprovativos para Validação ({pendingPayments.length})
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateTab('pagamentos')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Ver todos
                </button>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-2" />
                  Não há comprovativos pendentes de validação no momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map((p) => {
                    const mot = motoristas.find((m) => m.id === p.motorista_id);
                    const qt = quotas.find((q) => q.id === p.quota_id);
                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 text-xs space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {mot?.nome_completo} ({mot?.codigo_motorista})
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Quota: {qt?.titulo || 'Quota'} · Método: {getPaymentMethodLabel(p.metodo_pagamento)}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">
                              Ref: {p.referencia_transacao || '-'} · Data: {formatDate(p.data_pagamento)}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-sm text-purple-900 dark:text-purple-300">
                            {formatMoney(p.valor, config.moeda_simbolo)}
                          </span>
                        </div>

                        {p.comprovativo_nome && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span className="truncate">{p.comprovativo_nome}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100 dark:border-purple-900/60">
                          <button
                            onClick={() => setRejectingPayment(p)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded hover:bg-rose-50 transition-colors"
                          >
                            <ThumbsDown className="w-3 h-3" />
                            Rejeitar
                          </button>
                          <button
                            onClick={() => handleApprovePayment(p.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-xs"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            Aprovar e Emitir Recibo
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Motoristas em Atraso Crítico */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Controlo de Dívidas / Atrasos ({devedores.length})
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateTab('dividas')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Ver todos
                </button>
              </div>

              {devedores.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-2" />
                  Excelente! Nenhum motorista possui quotas vencidas em atraso.
                </div>
              ) : (
                <div className="space-y-3">
                  {devedores.slice(0, 4).map(({ motorista, totalDivida, quotasVencidasCount, diasAtrasoMax }) => (
                    <div
                      key={motorista.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 font-bold flex items-center justify-center font-mono">
                          {motorista.codigo_motorista}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {motorista.nome_completo}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {quotasVencidasCount} quota(s) vencida(s) · {diasAtrasoMax} dias de atraso
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-700 dark:text-rose-400 block">
                          {formatMoney(totalDivida, config.moeda_simbolo)}
                        </span>
                        <button
                          onClick={() => {
                            setPaymentInitialMotoristaId(motorista.id);
                            setIsPaymentModalOpen(true);
                          }}
                          className="mt-1 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:underline"
                        >
                          Registar Pagamento
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MOTORISTAS */}
      {activeNavTab === 'motoristas' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gestão de Motoristas de Táxi
              </h2>
              <p className="text-xs text-slate-500">
                Registo, consulta cadastral, estado operacional e histórico financeiro dos associados.
              </p>
            </div>

            <button
              onClick={() => {
                setDriverToEdit(undefined);
                setIsDriverModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              Registar Novo Motorista
            </button>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome, código (TX-...), matrícula ou telefone..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto text-xs">
              <button
                onClick={() => setDriverStatusFilter('todos')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  driverStatusFilter === 'todos'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos ({motoristas.length})
              </button>
              <button
                onClick={() => setDriverStatusFilter('ativo')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  driverStatusFilter === 'ativo'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Ativos ({motoristas.filter((m) => m.estado === 'ativo').length})
              </button>
              <button
                onClick={() => setDriverStatusFilter('inativo')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  driverStatusFilter === 'inativo'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Inativos ({motoristas.filter((m) => m.estado === 'inativo').length})
              </button>
            </div>
          </div>

          {/* Drivers Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Código</th>
                  <th className="py-2.5 px-4">Motorista</th>
                  <th className="py-2.5 px-4">Telefone / Contacto</th>
                  <th className="py-2.5 px-4">Viatura & Matrícula</th>
                  <th className="py-2.5 px-4 text-center">Estado</th>
                  <th className="py-2.5 px-4 text-right">Situação Financeira</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMotoristas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum motorista encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredMotoristas.map((m) => {
                    const mQuotas = quotas.filter((q) => q.motorista_id === m.id);
                    const overdue = mQuotas
                      .filter((q) => q.estado === 'vencida')
                      .reduce((acc, q) => acc + q.saldo_pendente, 0);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                          {m.codigo_motorista}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {m.nome_completo}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            BI: {m.bi_identificacao}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {m.telefone}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-800 dark:text-slate-200 block">
                            {m.viatura_marca_modelo}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {m.matricula}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              m.estado === 'ativo'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {m.estado === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {overdue > 0 ? (
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                              Dívida: {formatMoney(overdue, config.moeda_simbolo)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Regularizado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => setViewingDriver(m)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 rounded hover:bg-blue-100 transition-colors"
                          >
                            Ver Ficha
                          </button>
                          <button
                            onClick={() => {
                              setDriverToEdit(m);
                              setIsDriverModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                            title="Editar Dados"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: QUOTAS */}
      {activeNavTab === 'quotas' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gestão e Emissão de Quotas
              </h2>
              <p className="text-xs text-slate-500">
                Controlo de quotas semanais, quinzenais e mensais, prazos de vencimento e liquidação.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQuotaInitialMotoristaId(undefined);
                  setIsCreateQuotaModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Emitir Novas Quotas
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar quota ou motorista..."
                value={quotaSearch}
                onChange={(e) => setQuotaSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={quotaStatusFilter}
                onChange={(e) => setQuotaStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os Estados</option>
                <option value="paga">Pagas (Liquidadas)</option>
                <option value="parcialmente_paga">Parcialmente Pagas</option>
                <option value="pendente">Pendentes (Dentro do prazo)</option>
                <option value="vencida">Vencidas (Em atraso)</option>
              </select>
            </div>

            <div>
              <select
                value={quotaDriverFilter}
                onChange={(e) => setQuotaDriverFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os Motoristas</option>
                {motoristas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo_motorista} - {m.nome_completo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quotas Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Quota / Período</th>
                  <th className="py-2.5 px-4">Motorista</th>
                  <th className="py-2.5 px-4">Vencimento</th>
                  <th className="py-2.5 px-4 text-right">Valor Total</th>
                  <th className="py-2.5 px-4 text-right">Valor Pago</th>
                  <th className="py-2.5 px-4 text-right">Saldo Aberto</th>
                  <th className="py-2.5 px-4 text-center">Estado</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuotas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nenhuma quota encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredQuotas.map((q) => {
                    const mot = motoristas.find((m) => m.id === q.motorista_id);
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
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {mot?.nome_completo}
                          </span>
                          <span className="text-[11px] font-mono text-blue-700 dark:text-blue-400">
                            {mot?.codigo_motorista} ({mot?.matricula})
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
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
                              onClick={() => {
                                setPaymentInitialMotoristaId(q.motorista_id);
                                setPaymentInitialQuotaId(q.id);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs"
                            >
                              Registar Pagamento
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
        </div>
      )}

      {/* VIEW: PAGAMENTOS */}
      {activeNavTab === 'pagamentos' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gestão de Pagamentos e Validações
              </h2>
              <p className="text-xs text-slate-500">
                Registo manual, validação de comprovativos de motoristas e emissão de recibos oficiais.
              </p>
            </div>

            <button
              onClick={() => {
                setPaymentInitialMotoristaId(undefined);
                setPaymentInitialQuotaId(undefined);
                setIsPaymentModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
            >
              <DollarSign className="w-4 h-4" />
              Registar Pagamento Manual
            </button>
          </div>

          {/* Sub-tabs: Todos vs Pendentes de Validação */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setPaymentStatusTab('todos')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  paymentStatusTab === 'todos'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos ({pagamentos.length})
              </button>
              <button
                onClick={() => setPaymentStatusTab('pendentes')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors relative ${
                  paymentStatusTab === 'pendentes'
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pendentes de Validação ({pendingPayments.length})
              </button>
              <button
                onClick={() => setPaymentStatusTab('confirmados')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  paymentStatusTab === 'confirmados'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Confirmados ({pagamentos.filter((p) => p.estado === 'confirmado').length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar recibo, motorista ou ref..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Payments Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Nº Recibo</th>
                  <th className="py-2.5 px-4">Motorista</th>
                  <th className="py-2.5 px-4">Quota Associada</th>
                  <th className="py-2.5 px-4">Data Pagamento</th>
                  <th className="py-2.5 px-4">Método & Ref.</th>
                  <th className="py-2.5 px-4 text-right">Valor Pago</th>
                  <th className="py-2.5 px-4 text-center">Estado</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPagamentos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nenhum pagamento registado para este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredPagamentos.map((p) => {
                    const mot = motoristas.find((m) => m.id === p.motorista_id);
                    const qt = quotas.find((q) => q.id === p.quota_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-semibold text-blue-700 dark:text-blue-400">
                          {p.numero_recibo}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {mot?.nome_completo}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {mot?.codigo_motorista} ({mot?.matricula})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {qt?.titulo || 'Quota'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {formatDate(p.data_pagamento)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          <span className="font-medium">{getPaymentMethodLabel(p.metodo_pagamento)}</span>
                          {p.referencia_transacao && (
                            <span className="block font-mono text-[10px] text-slate-400">
                              Ref: {p.referencia_transacao}
                            </span>
                          )}
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
                            {p.estado === 'confirmado' ? 'Confirmado' : p.estado === 'pendente' ? 'Pendente' : 'Rejeitado'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {p.estado === 'confirmado' && (
                            <button
                              onClick={() => setReceiptToView(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              Ver Recibo
                            </button>
                          )}
                          {p.estado === 'pendente' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setRejectingPayment(p)}
                                className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded hover:bg-rose-100"
                              >
                                Rejeitar
                              </button>
                              <button
                                onClick={() => handleApprovePayment(p.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-xs"
                              >
                                Aprovar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CONTROLO DE DÍVIDAS */}
      {activeNavTab === 'dividas' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Painel de Controlo de Dívidas e Atrasos
              </h2>
              <p className="text-xs text-slate-500">
                Lista de motoristas com quotas vencidas, dias de atraso acumulados e envio de avisos de cobrança.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNotifTarget('todos');
                  setNotifTipo('atraso');
                  setNotifTitulo('Aviso Geral de Regularização de Quotas');
                  setNotifMensagem('Recordamos a todos os associados com quotas pendentes ou vencidas que devem regularizar a situação junto da tesouraria da ATPL.');
                  setIsSendNotifOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                <Bell className="w-4 h-4" />
                Emitir Aviso de Cobrança Geral
              </button>
            </div>
          </div>

          {/* Debt Summary Banner */}
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider block">
                Total Acumulado de Dívidas em Atraso
              </span>
              <span className="text-2xl font-mono font-extrabold text-rose-700 dark:text-rose-400 mt-1 block">
                {formatMoney(stats.totalDividas, config.moeda_simbolo)}
              </span>
            </div>
            <div className="text-xs text-rose-800 dark:text-rose-300 sm:text-right">
              <p><strong>{stats.motoristasEmAtrasoCount} motoristas</strong> possuem quotas vencidas.</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Calculado automaticamente de acordo com as regras de negócio.</p>
            </div>
          </div>

          {/* Debtors Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Código</th>
                  <th className="py-2.5 px-4">Motorista</th>
                  <th className="py-2.5 px-4">Telefone</th>
                  <th className="py-2.5 px-4">Viatura & Matrícula</th>
                  <th className="py-2.5 px-4 text-center">Quotas em Mora</th>
                  <th className="py-2.5 px-4 text-center">Maior Atraso</th>
                  <th className="py-2.5 px-4 text-right">Dívida Total</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {devedores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Não existem devedores registados! Todas as quotas estão em dia.
                    </td>
                  </tr>
                ) : (
                  devedores.map(({ motorista, totalDivida, quotasVencidasCount, diasAtrasoMax, quotasVencidas }) => (
                    <tr key={motorista.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-700 dark:text-rose-400">
                        {motorista.codigo_motorista}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {motorista.nome_completo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          BI: {motorista.bi_identificacao}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {motorista.telefone}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 dark:text-slate-200 block">
                          {motorista.viatura_marca_modelo}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {motorista.matricula}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          {quotasVencidasCount} quota(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-rose-700 dark:text-rose-400 font-semibold">
                        {diasAtrasoMax} dias
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-rose-700 dark:text-rose-400">
                        {formatMoney(totalDivida, config.moeda_simbolo)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => {
                            setNotifTarget(motorista.id);
                            setNotifTipo('atraso');
                            setNotifTitulo('Notificação de Cobrança de Quota');
                            setNotifMensagem(`Prezado ${motorista.nome_completo}, informamos que possui uma dívida de ${formatMoney(totalDivida, config.moeda_simbolo)} referente a quotas em atraso. Regularize a situação na sede da ATPL.`);
                            setIsSendNotifOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded hover:bg-rose-100 transition-colors"
                        >
                          Notificar
                        </button>
                        <button
                          onClick={() => {
                            setPaymentInitialMotoristaId(motorista.id);
                            setPaymentInitialQuotaId(quotasVencidas[0]?.id);
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs"
                        >
                          Liquidar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: RELATÓRIOS */}
      {activeNavTab === 'relatorios' && <ReportsView />}

      {/* VIEW: NOTIFICAÇÕES */}
      {activeNavTab === 'notificacoes' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Comunicação e Notificações aos Motoristas
              </h2>
              <p className="text-xs text-slate-500">
                Envie alertas de novas quotas, avisos de cobrança e comunicados institucionais.
              </p>
            </div>

            <button
              onClick={() => {
                setNotifTarget('todos');
                setNotifTipo('comunicado');
                setNotifTitulo('');
                setNotifMensagem('');
                setIsSendNotifOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
            >
              <Send className="w-4 h-4" />
              Novo Comunicado / Aviso
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {db.getNotificacoes().map((n) => {
              const dest = n.destinatario_id === 'todos'
                ? 'Todos os Motoristas'
                : n.destinatario_id === 'admin'
                ? 'Administração Geral'
                : motoristas.find((m) => m.id === n.destinatario_id)?.nome_completo || n.destinatario_id;

              return (
                <div
                  key={n.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs flex justify-between items-start gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{n.titulo}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Para: {dest}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {n.mensagem}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-2">
                        Enviada em: {formatDateTime(n.data_criacao)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: CONFIGURAÇÕES & AUDITORIA */}
      {activeNavTab === 'configuracoes' && (
        <SettingsView currentUser={currentUser} onRefreshData={onRefreshData} />
      )}

      {/* MODAL: DRIVER (NOVO OU EDITAR) */}
      {isDriverModalOpen && (
        <DriverModal
          currentUser={currentUser}
          driverToEdit={driverToEdit}
          onClose={() => setIsDriverModalOpen(false)}
          onSuccess={(driver) => {
            setIsDriverModalOpen(false);
            onRefreshData();
          }}
        />
      )}

      {/* MODAL: FICHA DETALHADA DO MOTORISTA */}
      {viewingDriver && (
        <DriverDetailsModal
          motorista={viewingDriver}
          currentUser={currentUser}
          onClose={() => setViewingDriver(undefined)}
          onEdit={(m) => {
            setViewingDriver(undefined);
            setDriverToEdit(m);
            setIsDriverModalOpen(true);
          }}
          onPayQuota={(quotaId) => {
            setViewingDriver(undefined);
            setPaymentInitialMotoristaId(viewingDriver.id);
            setPaymentInitialQuotaId(quotaId);
            setIsPaymentModalOpen(true);
          }}
          onViewReceipt={(p) => setReceiptToView(p)}
          onCreateQuotaForDriver={(mId) => {
            setViewingDriver(undefined);
            setQuotaInitialMotoristaId(mId);
            setIsCreateQuotaModalOpen(true);
          }}
          onStatusChanged={() => {
            onRefreshData();
            const reloaded = db.getMotoristaById(viewingDriver.id);
            if (reloaded) setViewingDriver(reloaded);
          }}
        />
      )}

      {/* MODAL: REGISTAR PAGAMENTO MANUAL */}
      {isPaymentModalOpen && (
        <PaymentModal
          currentUser={currentUser}
          initialMotoristaId={paymentInitialMotoristaId}
          initialQuotaId={paymentInitialQuotaId}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(pagamentoId) => {
            setIsPaymentModalOpen(false);
            onRefreshData();
            const p = db.getPagamentoById(pagamentoId);
            if (p) setReceiptToView(p);
          }}
        />
      )}

      {/* MODAL: EMITIR QUOTAS (LOTE OU INDIVIDUAL) */}
      {isCreateQuotaModalOpen && (
        <CreateQuotaModal
          currentUser={currentUser}
          initialMotoristaId={quotaInitialMotoristaId}
          onClose={() => setIsCreateQuotaModalOpen(false)}
          onSuccess={(count) => {
            setIsCreateQuotaModalOpen(false);
            onRefreshData();
          }}
        />
      )}

      {/* MODAL: VER RECIBO OFICIAL */}
      {receiptToView && (
        <ReceiptModal
          pagamento={receiptToView}
          onClose={() => setReceiptToView(null)}
        />
      )}

      {/* MODAL: REJEITAR COMPROVATIVO */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Rejeitar Comprovativo de Pagamento
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Indique o motivo da rejeição. O motorista será notificado para corrigir ou apresentar novo talão.
            </p>
            <textarea
              rows={3}
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingPayment(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR COMUNICADO / AVISO */}
      {isSendNotifOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Emitir Notificação / Aviso
              </h3>
              <button onClick={() => setIsSendNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifFeedback && (
              <div className="p-2.5 text-xs bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                {notifFeedback}
              </div>
            )}

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Destinatário</label>
                <select
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os Motoristas da Associação</option>
                  {motoristas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codigo_motorista} - {m.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Mensagem</label>
                <select
                  value={notifTipo}
                  onChange={(e) => setNotifTipo(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="comunicado">Comunicado Geral / Informação</option>
                  <option value="atraso">Aviso de Cobrança / Quota Vencida</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Título do Aviso</label>
                <input
                  type="text"
                  placeholder="Ex: Convocatória para Reunião Ordinária"
                  value={notifTitulo}
                  onChange={(e) => setNotifTitulo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mensagem</label>
                <textarea
                  rows={3}
                  placeholder="Escreva a mensagem a ser enviada ao painel do motorista..."
                  value={notifMensagem}
                  onChange={(e) => setNotifMensagem(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSendNotifOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Enviar Notificação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
