import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  PieChart,
  Printer,
  TrendingUp,
} from 'lucide-react';
import { db } from '../db/database';
import { Motorista, Pagamento, Quota } from '../types';
import { exportToCSV, formatDate, formatMoney, getPaymentMethodLabel } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const config = db.getConfig();
  const motoristas = db.getMotoristas();
  const quotas = db.getQuotas();
  const pagamentos = db.getPagamentos();

  type ReportType =
    | 'mensal'
    | 'diario'
    | 'anual'
    | 'motorista'
    | 'quotas_pagas'
    | 'quotas_pendentes'
    | 'dividas';

  const [reportType, setReportType] = useState<ReportType>('mensal');
  const [selectedMotoristaId, setSelectedMotoristaId] = useState<string>(motoristas[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-10');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  const handlePrint = () => {
    window.print();
  };

  // Compute dataset according to reportType
  let reportTitle = '';
  let reportSubtitle = '';
  let tableHeaders: string[] = [];
  let tableRows: (string | number)[][] = [];

  let totalPrevisto = 0;
  let totalRecebido = 0;
  let totalPendente = 0;
  let totalDivida = 0;

  if (reportType === 'diario') {
    reportTitle = `Relatório Financeiro Diário — ${formatDate(selectedDate)}`;
    reportSubtitle = `Arrecadação de quotas e pagamentos efetuados em ${formatDate(selectedDate)}.`;

    const filteredPagamentos = pagamentos.filter(
      (p) => p.data_pagamento === selectedDate && p.estado === 'confirmado'
    );

    totalRecebido = filteredPagamentos.reduce((acc, p) => acc + p.valor, 0);

    tableHeaders = ['Nº Recibo', 'Motorista', 'Código', 'Quota / Período', 'Método', 'Ref. Transação', 'Valor'];
    tableRows = filteredPagamentos.map((p) => {
      const mot = motoristas.find((m) => m.id === p.motorista_id);
      const qt = quotas.find((q) => q.id === p.quota_id);
      return [
        p.numero_recibo,
        mot?.nome_completo || 'N/D',
        mot?.codigo_motorista || 'N/D',
        qt?.titulo || 'Quota',
        getPaymentMethodLabel(p.metodo_pagamento),
        p.referencia_transacao || '-',
        formatMoney(p.valor, config.moeda_simbolo),
      ];
    });
  } else if (reportType === 'mensal') {
    reportTitle = `Relatório Financeiro Mensal — ${selectedMonth}`;
    reportSubtitle = `Consolidação de quotas emitidas e valores arrecadados no mês ${selectedMonth}.`;

    const monthQuotas = quotas.filter((q) => q.data_emissao.startsWith(selectedMonth));
    const monthPagamentos = pagamentos.filter(
      (p) => p.data_pagamento.startsWith(selectedMonth) && p.estado === 'confirmado'
    );

    totalPrevisto = monthQuotas.reduce((acc, q) => acc + q.valor_total, 0);
    totalRecebido = monthPagamentos.reduce((acc, p) => acc + p.valor, 0);
    totalPendente = monthQuotas.reduce((acc, q) => acc + q.saldo_pendente, 0);

    tableHeaders = ['Motorista', 'Código', 'Matrícula', 'Total Quotas', 'Liquidado', 'Saldo Aberto', 'Estado'];
    tableRows = motoristas.map((m) => {
      const mQuotas = monthQuotas.filter((q) => q.motorista_id === m.id);
      const mPrevisto = mQuotas.reduce((acc, q) => acc + q.valor_total, 0);
      const mPago = mQuotas.reduce((acc, q) => acc + q.valor_pago, 0);
      const mSaldo = mQuotas.reduce((acc, q) => acc + q.saldo_pendente, 0);

      const status = mSaldo === 0 ? 'Regularizado' : mPago > 0 ? 'Parcial' : 'Pendente';

      return [
        m.nome_completo,
        m.codigo_motorista,
        m.matricula,
        formatMoney(mPrevisto, config.moeda_simbolo),
        formatMoney(mPago, config.moeda_simbolo),
        formatMoney(mSaldo, config.moeda_simbolo),
        status,
      ];
    });
  } else if (reportType === 'anual') {
    reportTitle = `Relatório Financeiro Anual — Exercício ${selectedYear}`;
    reportSubtitle = `Balanço consolidado de quotas e receitas arrecadadas no ano ${selectedYear}.`;

    const yearQuotas = quotas.filter((q) => q.data_emissao.startsWith(selectedYear));
    const yearPagamentos = pagamentos.filter(
      (p) => p.data_pagamento.startsWith(selectedYear) && p.estado === 'confirmado'
    );

    totalPrevisto = yearQuotas.reduce((acc, q) => acc + q.valor_total, 0);
    totalRecebido = yearPagamentos.reduce((acc, p) => acc + p.valor, 0);
    totalPendente = yearQuotas.reduce((acc, q) => acc + q.saldo_pendente, 0);

    tableHeaders = ['Mês / Período', 'Quotas Emitidas', 'Valor Previsto', 'Valor Arrecadado', 'Saldo Pendente', 'Taxa de Cobrança'];
    
    // Group by month
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    tableRows = months.map((mStr) => {
      const prefix = `${selectedYear}-${mStr}`;
      const qInMonth = yearQuotas.filter((q) => q.data_emissao.startsWith(prefix));
      const pInMonth = yearPagamentos.filter((p) => p.data_pagamento.startsWith(prefix));

      const prev = qInMonth.reduce((acc, q) => acc + q.valor_total, 0);
      const rec = pInMonth.reduce((acc, p) => acc + p.valor, 0);
      const pend = qInMonth.reduce((acc, q) => acc + q.saldo_pendente, 0);
      const taxa = prev > 0 ? `${Math.round((rec / prev) * 100)}%` : '0%';

      return [
        `Mês ${mStr}/${selectedYear}`,
        qInMonth.length,
        formatMoney(prev, config.moeda_simbolo),
        formatMoney(rec, config.moeda_simbolo),
        formatMoney(pend, config.moeda_simbolo),
        taxa,
      ];
    });
  } else if (reportType === 'motorista') {
    const selectedMotorista = motoristas.find((m) => m.id === selectedMotoristaId);
    reportTitle = `Relatório Individual — ${selectedMotorista?.nome_completo || 'Motorista'}`;
    reportSubtitle = `Histórico detalhado de quotas, pagamentos e saldos para o código ${selectedMotorista?.codigo_motorista} (${selectedMotorista?.matricula}).`;

    const mQuotas = quotas.filter((q) => q.motorista_id === selectedMotoristaId);
    totalPrevisto = mQuotas.reduce((acc, q) => acc + q.valor_total, 0);
    totalRecebido = mQuotas.reduce((acc, q) => acc + q.valor_pago, 0);
    totalPendente = mQuotas.reduce((acc, q) => acc + q.saldo_pendente, 0);
    totalDivida = mQuotas
      .filter((q) => q.estado === 'vencida')
      .reduce((acc, q) => acc + q.saldo_pendente, 0);

    tableHeaders = ['Quota / Período', 'Vencimento', 'Valor Total', 'Valor Pago', 'Saldo em Aberto', 'Estado da Quota'];
    tableRows = mQuotas.map((q) => [
      q.titulo,
      formatDate(q.data_vencimento),
      formatMoney(q.valor_total, config.moeda_simbolo),
      formatMoney(q.valor_pago, config.moeda_simbolo),
      formatMoney(q.saldo_pendente, config.moeda_simbolo),
      q.estado.toUpperCase().replace('_', ' '),
    ]);
  } else if (reportType === 'quotas_pagas') {
    reportTitle = 'Relatório de Quotas Pagas e Liquidadas';
    reportSubtitle = 'Listagem de todas as obrigações que foram 100% liquidadas pelos motoristas.';

    const paidQuotas = quotas.filter((q) => q.estado === 'paga');
    totalRecebido = paidQuotas.reduce((acc, q) => acc + q.valor_total, 0);

    tableHeaders = ['Motorista', 'Código', 'Quota / Período', 'Vencimento', 'Valor Quota', 'Total Liquidado', 'Situação'];
    tableRows = paidQuotas.map((q) => {
      const mot = motoristas.find((m) => m.id === q.motorista_id);
      return [
        mot?.nome_completo || 'N/D',
        mot?.codigo_motorista || 'N/D',
        q.titulo,
        formatDate(q.data_vencimento),
        formatMoney(q.valor_total, config.moeda_simbolo),
        formatMoney(q.valor_pago, config.moeda_simbolo),
        'PAGA (100%)',
      ];
    });
  } else if (reportType === 'quotas_pendentes') {
    reportTitle = 'Relatório de Quotas Pendentes (A Vencer)';
    reportSubtitle = 'Quotas em aberto cujo prazo de vencimento ainda não expirou.';

    const pendingQuotas = quotas.filter((q) => q.estado === 'pendente' || q.estado === 'parcialmente_paga');
    totalPendente = pendingQuotas.reduce((acc, q) => acc + q.saldo_pendente, 0);

    tableHeaders = ['Motorista', 'Código', 'Quota / Período', 'Data Vencimento', 'Valor Total', 'Pago Parcial', 'Saldo a Receber'];
    tableRows = pendingQuotas.map((q) => {
      const mot = motoristas.find((m) => m.id === q.motorista_id);
      return [
        mot?.nome_completo || 'N/D',
        mot?.codigo_motorista || 'N/D',
        q.titulo,
        formatDate(q.data_vencimento),
        formatMoney(q.valor_total, config.moeda_simbolo),
        formatMoney(q.valor_pago, config.moeda_simbolo),
        formatMoney(q.saldo_pendente, config.moeda_simbolo),
      ];
    });
  } else if (reportType === 'dividas') {
    reportTitle = 'Relatório de Devedores e Quotas Vencidas';
    reportSubtitle = 'Listagem de quotas vencidas em atraso e cálculo de dívida por associado.';

    const overdueQuotas = quotas.filter((q) => q.estado === 'vencida');
    totalDivida = overdueQuotas.reduce((acc, q) => acc + q.saldo_pendente, 0);

    tableHeaders = ['Motorista', 'Código', 'Telefone', 'Quota Vencida', 'Data Vencimento', 'Dívida Acumulada', 'Observação'];
    tableRows = overdueQuotas.map((q) => {
      const mot = motoristas.find((m) => m.id === q.motorista_id);
      return [
        mot?.nome_completo || 'N/D',
        mot?.codigo_motorista || 'N/D',
        mot?.telefone || 'N/D',
        q.titulo,
        formatDate(q.data_vencimento),
        formatMoney(q.saldo_pendente, config.moeda_simbolo),
        'Atraso crítico',
      ];
    });
  }

  const handleExportCSV = () => {
    const filename = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(filename, tableHeaders, tableRows);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Módulo de Relatórios Financeiros
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gere extratos diários, mensais, anuais, balanços por motorista e relatórios de dívidas com exportação.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              Exportar para Excel (CSV)
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Relatório
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mensal">Relatório Mensal</option>
              <option value="diario">Relatório Diário</option>
              <option value="anual">Relatório Anual</option>
              <option value="motorista">Por Motorista Individual</option>
              <option value="dividas">Relatório de Dívidas / Atrasos</option>
              <option value="quotas_pagas">Quotas Pagas</option>
              <option value="quotas_pendentes">Quotas Pendentes</option>
            </select>
          </div>

          {reportType === 'diario' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Relatório
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {reportType === 'mensal' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mês de Referência
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {reportType === 'anual' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ano do Exercício
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          )}

          {reportType === 'motorista' && (
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selecionar Motorista
              </label>
              <select
                value={selectedMotoristaId}
                onChange={(e) => setSelectedMotoristaId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {motoristas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo_motorista} - {m.nome_completo} ({m.matricula})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        {/* Formal Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-blue-900 dark:text-blue-400">
                {config.sigla}
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {config.nome_organizacao}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              NIF: {config.nif} · Luanda, Angola · Telefone: {config.telefone}
            </p>
          </div>

          <div className="sm:text-right">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              {reportTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{reportSubtitle}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Data de Emissão: {new Date().toLocaleDateString('pt-AO')}
            </p>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Previsto</span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5 block">
              {formatMoney(totalPrevisto, config.moeda_simbolo)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">Total Arrecadado</span>
            <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300 mt-0.5 block">
              {formatMoney(totalRecebido, config.moeda_simbolo)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60">
            <span className="text-[11px] text-amber-700 dark:text-amber-400 block">Saldo Pendente</span>
            <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-300 mt-0.5 block">
              {formatMoney(totalPendente, config.moeda_simbolo)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60">
            <span className="text-[11px] text-rose-700 dark:text-rose-400 block">Dívidas Vencidas</span>
            <span className="font-mono font-bold text-sm text-rose-700 dark:text-rose-300 mt-0.5 block">
              {formatMoney(totalDivida, config.moeda_simbolo)}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                {tableHeaders.map((h, i) => (
                  <th key={i} className="py-2.5 px-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="py-8 text-center text-slate-400">
                    Nenhum registo encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-2.5 px-4 ${
                          String(cell).includes(config.moeda_simbolo) || String(cell).includes('%')
                            ? 'font-mono'
                            : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Report Footer / Signature */}
        <div className="pt-8 mt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <div>
            <p>Documento gerado automaticamente pelo Sistema de Gestão TáxiGest.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Associação de Táxis Personalizados de Luanda · Direção Financeira
            </p>
          </div>
          <div className="text-center sm:text-right">
            <div className="border-t border-slate-400 pt-2 px-6 inline-block">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                O Tesoureiro / Contabilidade
              </span>
              <span className="text-[10px] text-slate-400">Visto da Administração</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
