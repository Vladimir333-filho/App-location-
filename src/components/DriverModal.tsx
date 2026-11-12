import React, { useState } from 'react';
import { AlertCircle, Check, UserCheck, X } from 'lucide-react';
import { db } from '../db/database';
import { Motorista, MotoristaStatus, User } from '../types';

interface DriverModalProps {
  currentUser: User;
  driverToEdit?: Motorista;
  onClose: () => void;
  onSuccess: (driver: Motorista) => void;
}

export const DriverModal: React.FC<DriverModalProps> = ({
  currentUser,
  driverToEdit,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(driverToEdit);

  const [nomeCompleto, setNomeCompleto] = useState<string>(driverToEdit?.nome_completo || '');
  const [telefone, setTelefone] = useState<string>(driverToEdit?.telefone || '+244 ');
  const [email, setEmail] = useState<string>(driverToEdit?.email || '');
  const [biIdentificacao, setBiIdentificacao] = useState<string>(driverToEdit?.bi_identificacao || '');
  const [viaturaMarcaModelo, setViaturaMarcaModelo] = useState<string>(driverToEdit?.viatura_marca_modelo || '');
  const [matricula, setMatricula] = useState<string>(driverToEdit?.matricula || 'LD-');
  const [corViatura, setCorViatura] = useState<string>(driverToEdit?.cor_viatura || 'Branco');
  const [anoFabrico, setAnoFabrico] = useState<number>(driverToEdit?.ano_fabrico || 2022);
  const [dataAdmissao, setDataAdmissao] = useState<string>(
    driverToEdit?.data_admissao || new Date().toISOString().split('T')[0]
  );
  const [estado, setEstado] = useState<MotoristaStatus>(driverToEdit?.estado || 'ativo');
  const [notas, setNotas] = useState<string>(driverToEdit?.notas || '');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nomeCompleto.trim()) {
      setError('O nome completo do motorista é obrigatório.');
      return;
    }
    if (!telefone.trim() || telefone.trim() === '+244') {
      setError('O número de telefone é obrigatório.');
      return;
    }
    if (!biIdentificacao.trim()) {
      setError('O número do Bilhete de Identidade (BI) é obrigatório.');
      return;
    }
    if (!viaturaMarcaModelo.trim()) {
      setError('Informe a marca e modelo da viatura.');
      return;
    }
    if (!matricula.trim()) {
      setError('Informe a matrícula da viatura.');
      return;
    }

    try {
      const actor = { id: currentUser.id, nome: currentUser.nome };

      if (isEditing && driverToEdit) {
        const updated = db.updateMotorista(
          driverToEdit.id,
          {
            nome_completo: nomeCompleto.trim(),
            telefone: telefone.trim(),
            email: email.trim() || `${driverToEdit.codigo_motorista.toLowerCase()}@taxigest.ao`,
            bi_identificacao: biIdentificacao.trim(),
            viatura_marca_modelo: viaturaMarcaModelo.trim(),
            matricula: matricula.trim().toUpperCase(),
            cor_viatura: corViatura.trim(),
            ano_fabrico: Number(anoFabrico),
            data_admissao: dataAdmissao,
            estado,
            notas: notas.trim() || undefined,
          },
          actor
        );
        if (updated) onSuccess(updated);
      } else {
        const created = db.createMotorista(
          {
            nome_completo: nomeCompleto.trim(),
            telefone: telefone.trim(),
            email: email.trim(),
            bi_identificacao: biIdentificacao.trim(),
            viatura_marca_modelo: viaturaMarcaModelo.trim(),
            matricula: matricula.trim().toUpperCase(),
            cor_viatura: corViatura.trim(),
            ano_fabrico: Number(anoFabrico),
            data_admissao: dataAdmissao,
            estado,
            notas: notas.trim() || undefined,
          },
          actor
        );
        onSuccess(created);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar dados do motorista.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {isEditing ? `Editar Motorista (${driverToEdit?.codigo_motorista})` : 'Registar Novo Motorista'}
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

          {/* Dados Pessoais */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Identificação do Motorista
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Manuel Domingos Kitumba"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bilhete de Identidade (BI) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 004523910LA042"
                  value={biIdentificacao}
                  onChange={(e) => setBiIdentificacao(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: +244 923 456 789"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail de Contacto
                </label>
                <input
                  type="email"
                  placeholder="Ex: manuel@exemplo.ao"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Admissão
                </label>
                <input
                  type="date"
                  value={dataAdmissao}
                  onChange={(e) => setDataAdmissao(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dados da Viatura */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Viatura de Táxi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marca & Modelo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Toyota Hiace Standard"
                  value={viaturaMarcaModelo}
                  onChange={(e) => setViaturaMarcaModelo(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Matrícula <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: LD-24-89-GG"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full text-xs font-mono uppercase px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cor da Viatura
                </label>
                <input
                  type="text"
                  placeholder="Ex: Branco / Azul"
                  value={corViatura}
                  onChange={(e) => setCorViatura(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ano de Fabrico
                </label>
                <input
                  type="number"
                  min="1995"
                  max="2027"
                  value={anoFabrico}
                  onChange={(e) => setAnoFabrico(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Estado & Notas */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado Operacional
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as MotoristaStatus)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ativo">Ativo (Em circulação / Emissão de quotas regular)</option>
                  <option value="inativo">Inativo (Viatura parada / Suspenso)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Rota
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rota Benfica - Mutamba"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
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
              {isEditing ? 'Atualizar Motorista' : 'Gravar Motorista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
