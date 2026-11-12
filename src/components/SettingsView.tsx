import React, { useState } from 'react';
import {
  AlertCircle,
  Building,
  Check,
  CreditCard,
  FileText,
  History,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
} from 'lucide-react';
import { db } from '../db/database';
import { OrganizacaoConfig, PeriodicidadeQuota, User } from '../types';
import { formatDateTime, formatMoney } from '../utils/formatters';

interface SettingsViewProps {
  currentUser: User;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onRefreshData }) => {
  const [config, setConfig] = useState<OrganizacaoConfig>(db.getConfig());
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'geral' | 'auditoria'>('geral');

  const auditLogs = db.getAuditoria().filter((log) => {
    if (!auditSearch.trim()) return true;
    const term = auditSearch.toLowerCase();
    return (
      log.acao.toLowerCase().includes(term) ||
      log.utilizador_nome.toLowerCase().includes(term) ||
      log.detalhes.toLowerCase().includes(term) ||
      log.entidade.toLowerCase().includes(term)
    );
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateConfig(config, { id: currentUser.id, nome: currentUser.nome });
    setSuccessMsg('Configurações da organização guardadas com sucesso.');
    setTimeout(() => setSuccessMsg(''), 4000);
    onRefreshData();
  };

  const handleResetData = () => {
    if (window.confirm('Tem a certeza que deseja repor os dados de demonstração originais? Todas as alterações serão restauradas.')) {
      db.resetData();
      setConfig(db.getConfig());
      onRefreshData();
      setSuccessMsg('Base de dados restaurada com os dados padrão.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'geral'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Configurações da Organização
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'auditoria'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Registo de Auditoria ({auditLogs.length})
          </button>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Dados Originais
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: Configurações Gerais */}
      {activeTab === 'geral' && (
        <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          {/* Identidade */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Identidade Institucional
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nome da Organização / Cooperativa
                </label>
                <input
                  type="text"
                  value={config.nome_organizacao}
                  onChange={(e) => setConfig({ ...config, nome_organizacao: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Sigla da Associação
                </label>
                <input
                  type="text"
                  value={config.sigla}
                  onChange={(e) => setConfig({ ...config, sigla: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  NIF (Número de Identificação Fiscal)
                </label>
                <input
                  type="text"
                  value={config.nif}
                  onChange={(e) => setConfig({ ...config, nif: e.target.value })}
                  className="w-full font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Telefone Geral
                </label>
                <input
                  type="text"
                  value={config.telefone}
                  onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                  className="w-full font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  E-mail Oficial
                </label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Endereço da Sede
                </label>
                <input
                  type="text"
                  value={config.endereco}
                  onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Parâmetros de Quotas */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Parâmetros Financeiros e Quotas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Moeda do Sistema (Símbolo)
                </label>
                <input
                  type="text"
                  value={config.moeda_simbolo}
                  onChange={(e) => setConfig({ ...config, moeda_simbolo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="text-[10px] text-slate-400">Ex: Kz, €, $</span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Valor Padrão da Quota ({config.moeda_simbolo})
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={config.valor_quota_padrao}
                  onChange={(e) => setConfig({ ...config, valor_quota_padrao: Number(e.target.value) })}
                  className="w-full font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Periodicidade Padrão
                </label>
                <select
                  value={config.periodicidade_padrao}
                  onChange={(e) => setConfig({ ...config, periodicidade_padrao: e.target.value as PeriodicidadeQuota })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dados Bancários para Recebimento */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Contas de Recebimento de Quotas (Visível para Motoristas)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Número Multicaixa Express
                </label>
                <input
                  type="text"
                  value={config.multicaixa_express_numero}
                  onChange={(e) => setConfig({ ...config, multicaixa_express_numero: e.target.value })}
                  placeholder="Ex: 923000111"
                  className="w-full font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  IBAN Bancário
                </label>
                <input
                  type="text"
                  value={config.iban}
                  onChange={(e) => setConfig({ ...config, iban: e.target.value })}
                  placeholder="Ex: AO06 0040 0000 1234 5678 9012 3"
                  className="w-full font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Titular da Conta Bancária
                </label>
                <input
                  type="text"
                  value={config.titular_conta}
                  onChange={(e) => setConfig({ ...config, titular_conta: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              Guardar Alterações
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Registo de Auditoria */}
      {activeTab === 'auditoria' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Histórico Imutável de Auditoria
              </h3>
              <p className="text-xs text-slate-500">
                Todas as operações financeiras, registos de quotas, pagamentos e validações registadas no sistema.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar histórico..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Data e Hora</th>
                  <th className="py-2.5 px-3">Utilizador</th>
                  <th className="py-2.5 px-3">Operação Realizada</th>
                  <th className="py-2.5 px-3">Módulo</th>
                  <th className="py-2.5 px-3">Detalhes da Transação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Nenhum registo de auditoria encontrado.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.data_hora)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {log.utilizador_nome}
                      </td>
                      <td className="py-2.5 px-3 text-blue-700 dark:text-blue-400 font-medium">
                        {log.acao}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {log.entidade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {log.detalhes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
