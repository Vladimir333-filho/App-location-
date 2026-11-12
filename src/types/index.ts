export type UserRole = 'admin' | 'motorista';

export interface User {
  id: string;
  email: string;
  nome: string;
  perfil: UserRole;
  motorista_id?: string; // associado se perfil === 'motorista'
  ativo: boolean;
  avatar_url?: string;
  created_at: string;
}

export type MotoristaStatus = 'ativo' | 'inativo';

export interface Motorista {
  id: string;
  codigo_motorista: string; // Ex: TX-101
  nome_completo: string;
  telefone: string;
  email: string;
  bi_identificacao: string; // Bilhete de Identidade / Documento
  viatura_marca_modelo: string; // Ex: Toyota Hiace / Hyundai Elantra
  matricula: string; // Ex: LD-24-89-GG
  cor_viatura: string;
  ano_fabrico: number;
  data_admissao: string;
  estado: MotoristaStatus;
  foto_url?: string;
  notas?: string;
  created_at: string;
}

export type PeriodicidadeQuota = 'semanal' | 'quinzenal' | 'mensal';

export type QuotaStatus = 'paga' | 'parcialmente_paga' | 'pendente' | 'vencida';

export interface Quota {
  id: string;
  motorista_id: string;
  titulo: string; // Ex: Quota Semanal - Semana 45/2026
  referencia_periodo: string; // Ex: 2026-W45 ou 2026-11
  valor_total: number;
  valor_pago: number;
  saldo_pendente: number;
  data_emissao: string;
  data_vencimento: string;
  estado: QuotaStatus;
  observacoes?: string;
  created_at: string;
}

export type MetodoPagamento = 'dinheiro' | 'transferencia' | 'multicaixa_express' | 'outro';

export type PagamentoStatus = 'confirmado' | 'pendente' | 'rejeitado';

export interface Pagamento {
  id: string;
  numero_recibo: string; // Ex: REC-2026-0089
  motorista_id: string;
  quota_id: string;
  valor: number;
  data_pagamento: string;
  metodo_pagamento: MetodoPagamento;
  referencia_transacao?: string;
  observacoes?: string;
  comprovativo_url?: string;
  comprovativo_nome?: string;
  estado: PagamentoStatus;
  data_validacao?: string;
  validado_por?: string; // Nome do administrador
  motivo_rejeicao?: string;
  created_at: string;
}

export interface Notificacao {
  id: string;
  destinatario_id: string; // 'todos' ou motorista_id ou 'admin'
  tipo: 'nova_quota' | 'vencimento' | 'atraso' | 'pagamento_confirmado' | 'comunicado';
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_criacao: string;
}

export interface AuditLog {
  id: string;
  utilizador_id: string;
  utilizador_nome: string;
  acao: string; // Ex: 'Criou quota', 'Registou pagamento', 'Validou pagamento'
  entidade: 'motorista' | 'quota' | 'pagamento' | 'configuracao' | 'autenticacao';
  entidade_id?: string;
  detalhes: string;
  data_hora: string;
}

export interface OrganizacaoConfig {
  nome_organizacao: string;
  sigla: string;
  nif: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  moeda_simbolo: string; // Ex: Kz, €, $
  moeda_codigo: string; // AOA, EUR, USD
  valor_quota_padrao: number;
  periodicidade_padrao: PeriodicidadeQuota;
  dia_vencimento_padrao: number; // Dia da semana (1-7) ou dia do mês (1-31)
  iban: string;
  titular_conta: string;
  multicaixa_express_numero: string;
}
