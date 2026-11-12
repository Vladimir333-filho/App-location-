import {
  AuditLog,
  Motorista,
  Notificacao,
  OrganizacaoConfig,
  Pagamento,
  Quota,
  QuotaStatus,
  User,
} from '../types';

const STORAGE_KEY = 'taxigest_db_v1_store';

export interface DatabaseState {
  users: User[];
  motoristas: Motorista[];
  quotas: Quota[];
  pagamentos: Pagamento[];
  notificacoes: Notificacao[];
  auditoria: AuditLog[];
  config: OrganizacaoConfig;
}

const DEFAULT_CONFIG: OrganizacaoConfig = {
  nome_organizacao: 'Associação de Táxis Personalizados de Luanda',
  sigla: 'ATPL',
  nif: '5417098231',
  telefone: '+244 923 000 111',
  email: 'contacto@taxigest.ao',
  endereco: 'Avenida 4 de Fevereiro, Nº 142, Luanda',
  cidade: 'Luanda, Angola',
  moeda_simbolo: 'Kz',
  moeda_codigo: 'AOA',
  valor_quota_padrao: 15000,
  periodicidade_padrao: 'semanal',
  dia_vencimento_padrao: 5, // Sexta-feira
  iban: 'AO06 0040 0000 1234 5678 9012 3',
  titular_conta: 'Associação Táxis Personalizados Luanda',
  multicaixa_express_numero: '923000111',
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@taxigest.ao',
    nome: 'Carlos Menezes (Administrador Geral)',
    perfil: 'admin',
    ativo: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-mot-101',
    email: 'manuel.kitumba@taxigest.ao',
    nome: 'Manuel Domingos Kitumba',
    perfil: 'motorista',
    motorista_id: 'mot-101',
    ativo: true,
    created_at: '2026-01-10T09:30:00Z',
  },
  {
    id: 'usr-mot-102',
    email: 'antonio.pedro@taxigest.ao',
    nome: 'António Sebastião Pedro',
    perfil: 'motorista',
    motorista_id: 'mot-102',
    ativo: true,
    created_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 'usr-mot-103',
    email: 'mateus.gouveia@taxigest.ao',
    nome: 'Mateus Afonso Gouveia',
    perfil: 'motorista',
    motorista_id: 'mot-103',
    ativo: true,
    created_at: '2026-02-01T14:00:00Z',
  },
  {
    id: 'usr-mot-104',
    email: 'joaquim.silva@taxigest.ao',
    nome: 'Joaquim Bernardo Silva',
    perfil: 'motorista',
    motorista_id: 'mot-104',
    ativo: true,
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 'usr-mot-105',
    email: 'paulo.teca@taxigest.ao',
    nome: 'Paulo Gaspar Teca',
    perfil: 'motorista',
    motorista_id: 'mot-105',
    ativo: true,
    created_at: '2026-03-01T08:00:00Z',
  },
];

const INITIAL_MOTORISTAS: Motorista[] = [
  {
    id: 'mot-101',
    codigo_motorista: 'TX-101',
    nome_completo: 'Manuel Domingos Kitumba',
    telefone: '+244 923 456 789',
    email: 'manuel.kitumba@taxigest.ao',
    bi_identificacao: '004523910LA042',
    viatura_marca_modelo: 'Toyota Hiace Standard',
    matricula: 'LD-24-89-GG',
    cor_viatura: 'Branco / Azul',
    ano_fabrico: 2021,
    data_admissao: '2024-01-15',
    estado: 'ativo',
    notas: 'Motorista assíduo, rota Benfica - Mutamba.',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'mot-102',
    codigo_motorista: 'TX-102',
    nome_completo: 'António Sebastião Pedro',
    telefone: '+244 934 112 233',
    email: 'antonio.pedro@taxigest.ao',
    bi_identificacao: '007812934LA038',
    viatura_marca_modelo: 'Hyundai Elantra Comfort',
    matricula: 'LD-18-90-HA',
    cor_viatura: 'Cinza Prata',
    ano_fabrico: 2022,
    data_admissao: '2024-03-20',
    estado: 'ativo',
    notas: 'Serviço executivo e aeroporto.',
    created_at: '2024-03-20T11:00:00Z',
  },
  {
    id: 'mot-103',
    codigo_motorista: 'TX-103',
    nome_completo: 'Mateus Afonso Gouveia',
    telefone: '+244 945 778 899',
    email: 'mateus.gouveia@taxigest.ao',
    bi_identificacao: '009234512LA049',
    viatura_marca_modelo: 'Suzuki Dzire GLX',
    matricula: 'LD-91-34-FB',
    cor_viatura: 'Azul Marinho',
    ano_fabrico: 2023,
    data_admissao: '2024-06-10',
    estado: 'ativo',
    notas: 'Viatura nova, documentação em dia.',
    created_at: '2024-06-10T09:00:00Z',
  },
  {
    id: 'mot-104',
    codigo_motorista: 'TX-104',
    nome_completo: 'Joaquim Bernardo Silva',
    telefone: '+244 912 345 670',
    email: 'joaquim.silva@taxigest.ao',
    bi_identificacao: '003419827LA021',
    viatura_marca_modelo: 'Toyota Corolla Sedan',
    matricula: 'LD-05-67-CK',
    cor_viatura: 'Branco Pérola',
    ano_fabrico: 2020,
    data_admissao: '2024-08-01',
    estado: 'ativo',
    notas: 'Possui 2 quotas em atraso.',
    created_at: '2024-08-01T14:00:00Z',
  },
  {
    id: 'mot-105',
    codigo_motorista: 'TX-105',
    nome_completo: 'Paulo Gaspar Teca',
    telefone: '+244 921 987 654',
    email: 'paulo.teca@taxigest.ao',
    bi_identificacao: '006734190LA053',
    viatura_marca_modelo: 'Kia Rio 1.4',
    matricula: 'LD-73-12-MN',
    cor_viatura: 'Preto',
    ano_fabrico: 2019,
    data_admissao: '2024-09-15',
    estado: 'inativo',
    notas: 'Viatura em manutenção mecânica prolongada.',
    created_at: '2024-09-15T08:00:00Z',
  },
];

const INITIAL_QUOTAS: Quota[] = [
  // Manuel Kitumba (TX-101) - Exemplar
  {
    id: 'qt-101-1',
    motorista_id: 'mot-101',
    titulo: 'Quota Semanal - Semana 44/2026',
    referencia_periodo: '2026-W44',
    valor_total: 15000,
    valor_pago: 15000,
    saldo_pendente: 0,
    data_emissao: '2026-10-27',
    data_vencimento: '2026-11-01',
    estado: 'paga',
    created_at: '2026-10-27T08:00:00Z',
  },
  {
    id: 'qt-101-2',
    motorista_id: 'mot-101',
    titulo: 'Quota Semanal - Semana 45/2026',
    referencia_periodo: '2026-W45',
    valor_total: 15000,
    valor_pago: 15000,
    saldo_pendente: 0,
    data_emissao: '2026-11-03',
    data_vencimento: '2026-11-08',
    estado: 'paga',
    created_at: '2026-11-03T08:00:00Z',
  },
  {
    id: 'qt-101-3',
    motorista_id: 'mot-101',
    titulo: 'Quota Semanal - Semana 46/2026',
    referencia_periodo: '2026-W46',
    valor_total: 15000,
    valor_pago: 10000,
    saldo_pendente: 5000,
    data_emissao: '2026-11-10',
    data_vencimento: '2026-11-15',
    estado: 'parcialmente_paga',
    created_at: '2026-11-10T08:00:00Z',
  },

  // António Sebastião Pedro (TX-102) - Em dia com quota a vencer
  {
    id: 'qt-102-1',
    motorista_id: 'mot-102',
    titulo: 'Quota Semanal - Semana 45/2026',
    referencia_periodo: '2026-W45',
    valor_total: 15000,
    valor_pago: 15000,
    saldo_pendente: 0,
    data_emissao: '2026-11-03',
    data_vencimento: '2026-11-08',
    estado: 'paga',
    created_at: '2026-11-03T08:00:00Z',
  },
  {
    id: 'qt-102-2',
    motorista_id: 'mot-102',
    titulo: 'Quota Semanal - Semana 46/2026',
    referencia_periodo: '2026-W46',
    valor_total: 15000,
    valor_pago: 0,
    saldo_pendente: 15000,
    data_emissao: '2026-11-10',
    data_vencimento: '2026-11-15',
    estado: 'pendente',
    created_at: '2026-11-10T08:00:00Z',
  },

  // Mateus Afonso Gouveia (TX-103) - Tem pagamento pendente de aprovação
  {
    id: 'qt-103-1',
    motorista_id: 'mot-103',
    titulo: 'Quota Semanal - Semana 45/2026',
    referencia_periodo: '2026-W45',
    valor_total: 15000,
    valor_pago: 15000,
    saldo_pendente: 0,
    data_emissao: '2026-11-03',
    data_vencimento: '2026-11-08',
    estado: 'paga',
    created_at: '2026-11-03T08:00:00Z',
  },
  {
    id: 'qt-103-2',
    motorista_id: 'mot-103',
    titulo: 'Quota Semanal - Semana 46/2026',
    referencia_periodo: '2026-W46',
    valor_total: 15000,
    valor_pago: 0,
    saldo_pendente: 15000,
    data_emissao: '2026-11-10',
    data_vencimento: '2026-11-15',
    estado: 'pendente',
    created_at: '2026-11-10T08:00:00Z',
  },

  // Joaquim Bernardo Silva (TX-104) - Devedor com 2 quotas vencidas
  {
    id: 'qt-104-1',
    motorista_id: 'mot-104',
    titulo: 'Quota Semanal - Semana 43/2026',
    referencia_periodo: '2026-W43',
    valor_total: 15000,
    valor_pago: 5000,
    saldo_pendente: 10000,
    data_emissao: '2026-10-20',
    data_vencimento: '2026-10-25',
    estado: 'vencida',
    observacoes: 'Vencida há mais de 15 dias',
    created_at: '2026-10-20T08:00:00Z',
  },
  {
    id: 'qt-104-2',
    motorista_id: 'mot-104',
    titulo: 'Quota Semanal - Semana 44/2026',
    referencia_periodo: '2026-W44',
    valor_total: 15000,
    valor_pago: 0,
    saldo_pendente: 15000,
    data_emissao: '2026-10-27',
    data_vencimento: '2026-11-01',
    estado: 'vencida',
    observacoes: 'Vencida',
    created_at: '2026-10-27T08:00:00Z',
  },
  {
    id: 'qt-104-3',
    motorista_id: 'mot-104',
    titulo: 'Quota Semanal - Semana 45/2026',
    referencia_periodo: '2026-W45',
    valor_total: 15000,
    valor_pago: 0,
    saldo_pendente: 15000,
    data_emissao: '2026-11-03',
    data_vencimento: '2026-11-08',
    estado: 'vencida',
    created_at: '2026-11-03T08:00:00Z',
  },
];

const INITIAL_PAGAMENTOS: Pagamento[] = [
  {
    id: 'pag-001',
    numero_recibo: 'REC-2026-0041',
    motorista_id: 'mot-101',
    quota_id: 'qt-101-1',
    valor: 15000,
    data_pagamento: '2026-10-31',
    metodo_pagamento: 'multicaixa_express',
    referencia_transacao: 'MCX-98421034',
    observacoes: 'Pagamento total da semana 44',
    estado: 'confirmado',
    data_validacao: '2026-10-31T15:20:00Z',
    validado_por: 'Carlos Menezes (Admin)',
    created_at: '2026-10-31T14:15:00Z',
  },
  {
    id: 'pag-002',
    numero_recibo: 'REC-2026-0042',
    motorista_id: 'mot-101',
    quota_id: 'qt-101-2',
    valor: 15000,
    data_pagamento: '2026-11-06',
    metodo_pagamento: 'transferencia',
    referencia_transacao: 'TRF-BFA-109248',
    observacoes: 'Transferência confirmada na conta ATPL',
    estado: 'confirmado',
    data_validacao: '2026-11-06T16:00:00Z',
    validado_por: 'Carlos Menezes (Admin)',
    created_at: '2026-11-06T12:00:00Z',
  },
  {
    id: 'pag-003',
    numero_recibo: 'REC-2026-0043',
    motorista_id: 'mot-101',
    quota_id: 'qt-101-3',
    valor: 10000,
    data_pagamento: '2026-11-10',
    metodo_pagamento: 'dinheiro',
    referencia_transacao: 'DIR-CX-0081',
    observacoes: 'Primeira parcela de 10.000 Kz entregue na sede',
    estado: 'confirmado',
    data_validacao: '2026-11-10T11:30:00Z',
    validado_por: 'Carlos Menezes (Admin)',
    created_at: '2026-11-10T11:30:00Z',
  },
  {
    id: 'pag-004',
    numero_recibo: 'REC-2026-0044',
    motorista_id: 'mot-102',
    quota_id: 'qt-102-1',
    valor: 15000,
    data_pagamento: '2026-11-07',
    metodo_pagamento: 'multicaixa_express',
    referencia_transacao: 'MCX-87391022',
    observacoes: 'Pagamento total via Multicaixa Express',
    estado: 'confirmado',
    data_validacao: '2026-11-07T14:10:00Z',
    validado_por: 'Carlos Menezes (Admin)',
    created_at: '2026-11-07T10:05:00Z',
  },
  {
    id: 'pag-005',
    numero_recibo: 'REC-2026-0045',
    motorista_id: 'mot-103',
    quota_id: 'qt-103-1',
    valor: 15000,
    data_pagamento: '2026-11-08',
    metodo_pagamento: 'transferencia',
    referencia_transacao: 'TRF-BAI-771290',
    observacoes: 'Liquidação da quota da semana 45',
    estado: 'confirmado',
    data_validacao: '2026-11-08T17:00:00Z',
    validado_por: 'Carlos Menezes (Admin)',
    created_at: '2026-11-08T15:30:00Z',
  },
  // Pagamento PENDENTE DE VALIDAÇÃO (submetido pelo motorista Mateus Gouveia para a quota qt-103-2)
  {
    id: 'pag-006-pendente',
    numero_recibo: 'REC-2026-PEND-01',
    motorista_id: 'mot-103',
    quota_id: 'qt-103-2',
    valor: 15000,
    data_pagamento: '2026-11-11',
    metodo_pagamento: 'multicaixa_express',
    referencia_transacao: 'MCX-33991204',
    observacoes: 'Comprovativo enviado via app pelo motorista. Aguarda verificação bancária.',
    comprovativo_nome: 'comprovativo_mcx_11nov.jpg',
    comprovativo_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="300" height="150" fill="%23f1f5f9" stroke="%23cbd5e1"/><text x="150" y="70" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b" text-anchor="middle">MULTICAIXA EXPRESS</text><text x="150" y="95" font-family="monospace" font-size="12" fill="%23059669" text-anchor="middle">VALOR: 15.000,00 Kz</text><text x="150" y="120" font-family="sans-serif" font-size="10" fill="%2364748b" text-anchor="middle">REF: MCX-33991204 - 11/11/2026</text></svg>',
    estado: 'pendente',
    created_at: '2026-11-11T07:15:00Z',
  },
  {
    id: 'pag-007',
    numero_recibo: 'REC-2026-0046',
    motorista_id: 'mot-104',
    quota_id: 'qt-104-1',
    valor: 5000,
    data_pagamento: '2026-10-24',
    metodo_pagamento: 'dinheiro',
    referencia_transacao: 'DIR-CX-0072',
    observacoes: 'Pagamento parcial de 5.000 Kz. Ficou pendente 10.000 Kz.',
    estado: 'confirmado',
    data_validacao: '2026-10-24T16:00:00Z',
    validado_por: 'Carlos Menezes (Admin)',
    created_at: '2026-10-24T16:00:00Z',
  },
];

const INITIAL_NOTIFICACOES: Notificacao[] = [
  {
    id: 'notif-1',
    destinatario_id: 'mot-104',
    tipo: 'atraso',
    titulo: 'Aviso de Quota em Atraso',
    mensagem: 'Prezado Joaquim Silva, você possui quotas vencidas no valor acumulado de 40.000 Kz. Por favor, regularize na secretaria ou via Multicaixa Express.',
    lida: false,
    data_criacao: '2026-11-09T09:00:00Z',
  },
  {
    id: 'notif-2',
    destinatario_id: 'mot-101',
    tipo: 'pagamento_confirmado',
    titulo: 'Pagamento de Quota Confirmado',
    mensagem: 'Recebemos o seu pagamento parcial de 10.000 Kz referente à Quota Semanal 46/2026. Recibo REC-2026-0043 emitido.',
    lida: true,
    data_criacao: '2026-11-10T11:35:00Z',
  },
  {
    id: 'notif-3',
    destinatario_id: 'admin',
    tipo: 'comunicado',
    titulo: 'Comprovativo de Pagamento Submetido',
    mensagem: 'O motorista Mateus Afonso Gouveia submeteu um comprovativo de 15.000 Kz via Multicaixa Express para validação.',
    lida: false,
    data_criacao: '2026-11-11T07:15:00Z',
  },
  {
    id: 'notif-4',
    destinatario_id: 'todos',
    tipo: 'comunicado',
    titulo: 'Reunião Geral da Associação de Táxis',
    mensagem: 'Convocatória para a Assembleia Geral ordinária no próximo sábado, às 10h, na sede da ATPL. Pauta: reajuste de tabelas e seguro automóvel coletivo.',
    lida: true,
    data_criacao: '2026-11-05T14:00:00Z',
  },
];

const INITIAL_AUDITORIA: AuditLog[] = [
  {
    id: 'aud-001',
    utilizador_id: 'usr-admin-1',
    utilizador_nome: 'Carlos Menezes (Admin)',
    acao: 'Emissão em Lote de Quotas',
    entidade: 'quota',
    entidade_id: 'lote-2026-W46',
    detalhes: 'Geração de quotas da Semana 46/2026 para todos os 4 motoristas ativos.',
    data_hora: '2026-11-10T08:00:00Z',
  },
  {
    id: 'aud-002',
    utilizador_id: 'usr-admin-1',
    utilizador_nome: 'Carlos Menezes (Admin)',
    acao: 'Registo de Pagamento',
    entidade: 'pagamento',
    entidade_id: 'pag-003',
    detalhes: 'Registo manual de pagamento em dinheiro de 10.000 Kz para Manuel Kitumba (TX-101).',
    data_hora: '2026-11-10T11:30:00Z',
  },
  {
    id: 'aud-003',
    utilizador_id: 'usr-mot-103',
    utilizador_nome: 'Mateus Afonso Gouveia',
    acao: 'Submissão de Comprovativo',
    entidade: 'pagamento',
    entidade_id: 'pag-006-pendente',
    detalhes: 'Submissão de comprovativo de 15.000 Kz via Multicaixa Express para validação.',
    data_hora: '2026-11-11T07:15:00Z',
  },
];

class DatabaseService {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
    this.recomputeAllQuotaStates();
  }

  private loadState(): DatabaseState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar base de dados local, usando estado inicial:', e);
    }
    return {
      users: INITIAL_USERS,
      motoristas: INITIAL_MOTORISTAS,
      quotas: INITIAL_QUOTAS,
      pagamentos: INITIAL_PAGAMENTOS,
      notificacoes: INITIAL_NOTIFICACOES,
      auditoria: INITIAL_AUDITORIA,
      config: DEFAULT_CONFIG,
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Falha ao guardar dados no localStorage:', e);
    }
  }

  // --- MOTORISTAS ---
  public getMotoristas(): Motorista[] {
    return [...this.state.motoristas];
  }

  public getMotoristaById(id: string): Motorista | undefined {
    return this.state.motoristas.find((m) => m.id === id);
  }

  public getMotoristaByCodigo(codigo: string): Motorista | undefined {
    return this.state.motoristas.find(
      (m) => m.codigo_motorista.toLowerCase() === codigo.trim().toLowerCase()
    );
  }

  public createMotorista(data: Omit<Motorista, 'id' | 'codigo_motorista' | 'created_at'>, actor: { id: string; nome: string }): Motorista {
    const nextNum = this.state.motoristas.length + 101;
    const codigo = `TX-${nextNum}`;
    const newMotorista: Motorista = {
      id: `mot-${Date.now()}`,
      codigo_motorista: codigo,
      created_at: new Date().toISOString(),
      ...data,
    };

    this.state.motoristas.push(newMotorista);

    // Auto-create matching driver user
    const newUser: User = {
      id: `usr-${newMotorista.id}`,
      email: data.email || `${codigo.toLowerCase()}@taxigest.ao`,
      nome: data.nome_completo,
      perfil: 'motorista',
      motorista_id: newMotorista.id,
      ativo: data.estado === 'ativo',
      created_at: new Date().toISOString(),
    };
    this.state.users.push(newUser);

    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: 'Registo de Novo Motorista',
      entidade: 'motorista',
      entidade_id: newMotorista.id,
      detalhes: `Novo motorista registado: ${newMotorista.nome_completo} (${codigo}) com viatura ${newMotorista.matricula}.`,
    });

    this.saveState();
    return newMotorista;
  }

  public updateMotorista(id: string, data: Partial<Motorista>, actor: { id: string; nome: string }): Motorista | null {
    const idx = this.state.motoristas.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    const current = this.state.motoristas[idx];
    const updated: Motorista = {
      ...current,
      ...data,
      id: current.id,
      codigo_motorista: current.codigo_motorista,
      created_at: current.created_at,
    };
    this.state.motoristas[idx] = updated;

    // Update corresponding user name if changed
    const userIdx = this.state.users.findIndex((u) => u.motorista_id === id);
    if (userIdx !== -1) {
      this.state.users[userIdx].nome = updated.nome_completo;
      if (updated.email) this.state.users[userIdx].email = updated.email;
      this.state.users[userIdx].ativo = updated.estado === 'ativo';
    }

    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: 'Atualização de Motorista',
      entidade: 'motorista',
      entidade_id: id,
      detalhes: `Dados do motorista ${updated.nome_completo} (${updated.codigo_motorista}) atualizados.`,
    });

    this.saveState();
    return updated;
  }

  public toggleMotoristaStatus(id: string, actor: { id: string; nome: string }): Motorista | null {
    const motorista = this.getMotoristaById(id);
    if (!motorista) return null;
    const novoEstado = motorista.estado === 'ativo' ? 'inativo' : 'ativo';
    return this.updateMotorista(id, { estado: novoEstado }, actor);
  }

  // --- QUOTAS & RECALCULATION ---
  public getQuotas(filter?: { motorista_id?: string; estado?: QuotaStatus }): Quota[] {
    let result = [...this.state.quotas];
    if (filter?.motorista_id) {
      result = result.filter((q) => q.motorista_id === filter.motorista_id);
    }
    if (filter?.estado) {
      result = result.filter((q) => q.estado === filter.estado);
    }
    return result.sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime());
  }

  public getQuotaById(id: string): Quota | undefined {
    return this.state.quotas.find((q) => q.id === id);
  }

  public createQuota(data: Omit<Quota, 'id' | 'valor_pago' | 'saldo_pendente' | 'estado' | 'created_at'>, actor: { id: string; nome: string }): Quota {
    const newQuota: Quota = {
      id: `qt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      valor_pago: 0,
      saldo_pendente: data.valor_total,
      estado: this.calculateQuotaStatus(data.valor_total, 0, data.data_vencimento),
      created_at: new Date().toISOString(),
      ...data,
    };

    this.state.quotas.push(newQuota);

    // Notify driver
    const motorista = this.getMotoristaById(data.motorista_id);
    this.sendNotification({
      destinatario_id: data.motorista_id,
      tipo: 'nova_quota',
      titulo: 'Nova Quota Atribuída',
      mensagem: `Foi emitida a ${newQuota.titulo} no valor de ${newQuota.valor_total.toLocaleString('pt-AO')} ${this.state.config.moeda_simbolo}. Vencimento: ${newQuota.data_vencimento}.`,
    });

    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: 'Criação de Quota',
      entidade: 'quota',
      entidade_id: newQuota.id,
      detalhes: `Quota "${newQuota.titulo}" criada para motorista ${motorista?.nome_completo || data.motorista_id} no valor de ${newQuota.valor_total} ${this.state.config.moeda_simbolo}.`,
    });

    this.saveState();
    return newQuota;
  }

  public generateBatchQuotas(
    params: {
      titulo_base: string;
      referencia_periodo: string;
      valor_total: number;
      data_emissao: string;
      data_vencimento: string;
      observacoes?: string;
    },
    actor: { id: string; nome: string }
  ): { count: number; quotas: Quota[] } {
    const ativos = this.state.motoristas.filter((m) => m.estado === 'ativo');
    const created: Quota[] = [];

    for (const m of ativos) {
      // Check if already exists for this driver and period
      const exists = this.state.quotas.some(
        (q) => q.motorista_id === m.id && q.referencia_periodo === params.referencia_periodo
      );
      if (!exists) {
        const q: Quota = {
          id: `qt-${Date.now()}-${m.codigo_motorista}`,
          motorista_id: m.id,
          titulo: `${params.titulo_base} - ${m.codigo_motorista}`,
          referencia_periodo: params.referencia_periodo,
          valor_total: params.valor_total,
          valor_pago: 0,
          saldo_pendente: params.valor_total,
          data_emissao: params.data_emissao,
          data_vencimento: params.data_vencimento,
          estado: this.calculateQuotaStatus(params.valor_total, 0, params.data_vencimento),
          observacoes: params.observacoes,
          created_at: new Date().toISOString(),
        };
        this.state.quotas.push(q);
        created.push(q);

        this.sendNotification({
          destinatario_id: m.id,
          tipo: 'nova_quota',
          titulo: 'Nova Quota Emitida',
          mensagem: `Emitida a quota ${params.referencia_periodo} no valor de ${params.valor_total.toLocaleString('pt-AO')} ${this.state.config.moeda_simbolo}. Vencimento: ${params.data_vencimento}.`,
        });
      }
    }

    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: 'Geração de Quotas em Lote',
      entidade: 'quota',
      entidade_id: params.referencia_periodo,
      detalhes: `Geradas ${created.length} quotas para o período ${params.referencia_periodo} no valor unitário de ${params.valor_total} ${this.state.config.moeda_simbolo}.`,
    });

    this.saveState();
    return { count: created.length, quotas: created };
  }

  // Business formula calculation
  public calculateQuotaStatus(valorTotal: number, valorPagoConfirmado: number, dataVencimento: string): QuotaStatus {
    const saldo = valorTotal - valorPagoConfirmado;
    if (saldo <= 0) return 'paga';
    
    const today = new Date().toISOString().split('T')[0];
    const isVencida = today > dataVencimento;

    if (valorPagoConfirmado > 0) {
      return isVencida ? 'vencida' : 'parcialmente_paga';
    }
    return isVencida ? 'vencida' : 'pendente';
  }

  public recalculateQuota(quotaId: string): void {
    const quota = this.state.quotas.find((q) => q.id === quotaId);
    if (!quota) return;

    // Sum all confirmed payments for this quota
    const confirmedPayments = this.state.pagamentos.filter(
      (p) => p.quota_id === quotaId && p.estado === 'confirmado'
    );
    const totalPago = confirmedPayments.reduce((acc, curr) => acc + curr.valor, 0);
    const saldoPendente = Math.max(0, quota.valor_total - totalPago);

    quota.valor_pago = totalPago;
    quota.saldo_pendente = saldoPendente;
    quota.estado = this.calculateQuotaStatus(quota.valor_total, totalPago, quota.data_vencimento);
    this.saveState();
  }

  private recomputeAllQuotaStates(): void {
    for (const q of this.state.quotas) {
      const confirmed = this.state.pagamentos.filter(
        (p) => p.quota_id === q.id && p.estado === 'confirmado'
      );
      const totalPago = confirmed.reduce((acc, curr) => acc + curr.valor, 0);
      q.valor_pago = totalPago;
      q.saldo_pendente = Math.max(0, q.valor_total - totalPago);
      q.estado = this.calculateQuotaStatus(q.valor_total, totalPago, q.data_vencimento);
    }
    this.saveState();
  }

  // --- PAGAMENTOS ---
  public getPagamentos(filter?: { motorista_id?: string; estado?: string; quota_id?: string }): Pagamento[] {
    let list = [...this.state.pagamentos];
    if (filter?.motorista_id) {
      list = list.filter((p) => p.motorista_id === filter.motorista_id);
    }
    if (filter?.estado) {
      list = list.filter((p) => p.estado === filter.estado);
    }
    if (filter?.quota_id) {
      list = list.filter((p) => p.quota_id === filter.quota_id);
    }
    return list.sort((a, b) => new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime());
  }

  public getPagamentoById(id: string): Pagamento | undefined {
    return this.state.pagamentos.find((p) => p.id === id);
  }

  public createPagamento(
    data: {
      motorista_id: string;
      quota_id: string;
      valor: number;
      data_pagamento: string;
      metodo_pagamento: Pagamento['metodo_pagamento'];
      referencia_transacao?: string;
      observacoes?: string;
      comprovativo_url?: string;
      comprovativo_nome?: string;
      estado?: Pagamento['estado']; // se criado por admin, confirmado; se por motorista, pendente
    },
    actor: { id: string; nome: string; perfil: string }
  ): Pagamento {
    // Check duplication: same reference or identical payment within same minute
    if (data.referencia_transacao && data.referencia_transacao.trim()) {
      const duplicate = this.state.pagamentos.find(
        (p) =>
          p.referencia_transacao &&
          p.referencia_transacao.trim().toLowerCase() === data.referencia_transacao?.trim().toLowerCase() &&
          p.estado !== 'rejeitado'
      );
      if (duplicate) {
        throw new Error(`Referência de transação "${data.referencia_transacao}" já foi registada anteriormente (Recibo: ${duplicate.numero_recibo}).`);
      }
    }

    const receiptCount = this.state.pagamentos.length + 47;
    const year = new Date().getFullYear();
    const isPendente = data.estado === 'pendente' || actor.perfil === 'motorista';
    const numeroRecibo = isPendente
      ? `REC-${year}-PEND-${receiptCount}`
      : `REC-${year}-${String(receiptCount).padStart(4, '0')}`;

    const newPagamento: Pagamento = {
      id: `pag-${Date.now()}`,
      numero_recibo: numeroRecibo,
      motorista_id: data.motorista_id,
      quota_id: data.quota_id,
      valor: data.valor,
      data_pagamento: data.data_pagamento,
      metodo_pagamento: data.metodo_pagamento,
      referencia_transacao: data.referencia_transacao,
      observacoes: data.observacoes,
      comprovativo_url: data.comprovativo_url,
      comprovativo_nome: data.comprovativo_nome,
      estado: isPendente ? 'pendente' : 'confirmado',
      data_validacao: isPendente ? undefined : new Date().toISOString(),
      validado_por: isPendente ? undefined : actor.nome,
      created_at: new Date().toISOString(),
    };

    this.state.pagamentos.push(newPagamento);

    if (newPagamento.estado === 'confirmado') {
      this.recalculateQuota(data.quota_id);
      // Notify driver
      this.sendNotification({
        destinatario_id: data.motorista_id,
        tipo: 'pagamento_confirmado',
        titulo: 'Pagamento Registado com Sucesso',
        mensagem: `Pagamento de ${data.valor.toLocaleString('pt-AO')} ${this.state.config.moeda_simbolo} confirmado. Recibo ${newPagamento.numero_recibo} gerado.`,
      });
    } else {
      // Notify admin
      const mot = this.getMotoristaById(data.motorista_id);
      this.sendNotification({
        destinatario_id: 'admin',
        tipo: 'comunicado',
        titulo: 'Novo Comprovativo Aguarda Validação',
        mensagem: `O motorista ${mot?.nome_completo || data.motorista_id} submeteu um comprovativo de ${data.valor.toLocaleString('pt-AO')} ${this.state.config.moeda_simbolo} (${newPagamento.metodo_pagamento}).`,
      });
    }

    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: isPendente ? 'Submissão de Comprovativo de Pagamento' : 'Registo Manual de Pagamento',
      entidade: 'pagamento',
      entidade_id: newPagamento.id,
      detalhes: `Pagamento de ${newPagamento.valor} ${this.state.config.moeda_simbolo} registado com estado "${newPagamento.estado}". Recibo: ${newPagamento.numero_recibo}.`,
    });

    this.saveState();
    return newPagamento;
  }

  public confirmPayment(id: string, actor: { id: string; nome: string }): Pagamento | null {
    const p = this.state.pagamentos.find((item) => item.id === id);
    if (!p) return null;

    const year = new Date().getFullYear();
    const receiptCount = this.state.pagamentos.filter((x) => x.estado === 'confirmado').length + 50;
    
    // Assign official receipt number if it had a PEND receipt
    if (p.numero_recibo.includes('PEND')) {
      p.numero_recibo = `REC-${year}-${String(receiptCount).padStart(4, '0')}`;
    }

    p.estado = 'confirmado';
    p.data_validacao = new Date().toISOString();
    p.validado_por = actor.nome;

    this.recalculateQuota(p.quota_id);

    // Notify driver
    this.sendNotification({
      destinatario_id: p.motorista_id,
      tipo: 'pagamento_confirmado',
      titulo: 'Comprovativo Validado com Sucesso',
      mensagem: `O seu pagamento de ${p.valor.toLocaleString('pt-AO')} ${this.state.config.moeda_simbolo} foi validado pela administração. Recibo oficial: ${p.numero_recibo}.`,
    });

    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: 'Validação de Pagamento',
      entidade: 'pagamento',
      entidade_id: p.id,
      detalhes: `Pagamento validado e aprovado. Recibo emitido: ${p.numero_recibo} no valor de ${p.valor} ${this.state.config.moeda_simbolo}.`,
    });

    this.saveState();
    return p;
  }

  public rejectPayment(id: string, motivo: string, actor: { id: string; nome: string }): Pagamento | null {
    const p = this.state.pagamentos.find((item) => item.id === id);
    if (!p) return null;

    p.estado = 'rejeitado';
    p.motivo_rejeicao = motivo;
    p.data_validacao = new Date().toISOString();
    p.validado_por = actor.nome;

    this.recalculateQuota(p.quota_id);

    // Notify driver
    this.sendNotification({
      destinatario_id: p.motorista_id,
      tipo: 'atraso',
      titulo: 'Comprovativo de Pagamento Não Aprovado',
      mensagem: `O seu comprovativo no valor de ${p.valor.toLocaleString('pt-AO')} ${this.state.config.moeda_simbolo} foi rejeitado. Motivo: ${motivo}. Por favor, entre em contacto com a administração.`,
    });

    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: 'Rejeição de Pagamento',
      entidade: 'pagamento',
      entidade_id: p.id,
      detalhes: `Pagamento de ${p.valor} ${this.state.config.moeda_simbolo} rejeitado. Motivo: ${motivo}.`,
    });

    this.saveState();
    return p;
  }

  // --- CONTROLO DE DÍVIDAS & ESTATÍSTICAS ---
  public getDevedores(): Array<{
    motorista: Motorista;
    totalDivida: number;
    quotasVencidasCount: number;
    quotasVencidas: Quota[];
    diasAtrasoMax: number;
  }> {
    const devedoresMap = new Map<string, { motorista: Motorista; quotas: Quota[] }>();
    const today = new Date().getTime();

    for (const q of this.state.quotas) {
      if (q.estado === 'vencida' && q.saldo_pendente > 0) {
        const m = this.getMotoristaById(q.motorista_id);
        if (m) {
          if (!devedoresMap.has(m.id)) {
            devedoresMap.set(m.id, { motorista: m, quotas: [] });
          }
          devedoresMap.get(m.id)!.quotas.push(q);
        }
      }
    }

    const result = Array.from(devedoresMap.values()).map(({ motorista, quotas }) => {
      const totalDivida = quotas.reduce((acc, q) => acc + q.saldo_pendente, 0);
      let diasAtrasoMax = 0;
      quotas.forEach((q) => {
        const diff = Math.floor((today - new Date(q.data_vencimento).getTime()) / (1000 * 60 * 60 * 24));
        if (diff > diasAtrasoMax) diasAtrasoMax = diff;
      });

      return {
        motorista,
        totalDivida,
        quotasVencidasCount: quotas.length,
        quotasVencidas: quotas,
        diasAtrasoMax,
      };
    });

    return result.sort((a, b) => b.totalDivida - a.totalDivida);
  }

  public getFinancialStats(): {
    totalMotoristas: number;
    motoristasAtivos: number;
    motoristasInativos: number;
    totalQuotasPrevistas: number;
    totalRecebido: number;
    totalPendente: number;
    totalDividas: number;
    recebidoHoje: number;
    recebidoMes: number;
    motoristasEmAtrasoCount: number;
    pagamentosPendentesCount: number;
  } {
    const totalMotoristas = this.state.motoristas.length;
    const motoristasAtivos = this.state.motoristas.filter((m) => m.estado === 'ativo').length;
    const motoristasInativos = totalMotoristas - motoristasAtivos;

    const totalQuotasPrevistas = this.state.quotas.reduce((acc, q) => acc + q.valor_total, 0);
    
    // Confirmed payments total
    const confirmedPayments = this.state.pagamentos.filter((p) => p.estado === 'confirmado');
    const totalRecebido = confirmedPayments.reduce((acc, p) => acc + p.valor, 0);

    // Pending vs Overdue
    let totalPendente = 0;
    let totalDividas = 0;

    for (const q of this.state.quotas) {
      if (q.estado === 'vencida') {
        totalDividas += q.saldo_pendente;
      } else if (q.estado === 'pendente' || q.estado === 'parcialmente_paga') {
        totalPendente += q.saldo_pendente;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    const recebidoHoje = confirmedPayments
      .filter((p) => p.data_pagamento === todayStr)
      .reduce((acc, p) => acc + p.valor, 0);

    const recebidoMes = confirmedPayments
      .filter((p) => p.data_pagamento.startsWith(currentMonthStr))
      .reduce((acc, p) => acc + p.valor, 0);

    const devedores = this.getDevedores();
    const pagamentosPendentesCount = this.state.pagamentos.filter((p) => p.estado === 'pendente').length;

    return {
      totalMotoristas,
      motoristasAtivos,
      motoristasInativos,
      totalQuotasPrevistas,
      totalRecebido,
      totalPendente,
      totalDividas,
      recebidoHoje,
      recebidoMes,
      motoristasEmAtrasoCount: devedores.length,
      pagamentosPendentesCount,
    };
  }

  // --- NOTIFICACOES ---
  public getNotificacoes(destinatarioId?: string): Notificacao[] {
    let list = [...this.state.notificacoes];
    if (destinatarioId) {
      list = list.filter(
        (n) => n.destinatario_id === destinatarioId || n.destinatario_id === 'todos'
      );
    }
    return list.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
  }

  public markNotificacaoRead(id: string): void {
    const notif = this.state.notificacoes.find((n) => n.id === id);
    if (notif) {
      notif.lida = true;
      this.saveState();
    }
  }

  public markAllNotificacoesRead(destinatarioId?: string): void {
    for (const n of this.state.notificacoes) {
      if (!destinatarioId || n.destinatario_id === destinatarioId || n.destinatario_id === 'todos') {
        n.lida = true;
      }
    }
    this.saveState();
  }

  public sendNotification(data: Omit<Notificacao, 'id' | 'lida' | 'data_criacao'>): Notificacao {
    const newNotif: Notificacao = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      lida: false,
      data_criacao: new Date().toISOString(),
      ...data,
    };
    this.state.notificacoes.unshift(newNotif);
    this.saveState();
    return newNotif;
  }

  // --- AUDITORIA ---
  public getAuditoria(): AuditLog[] {
    return [...this.state.auditoria].sort(
      (a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
    );
  }

  public logAudit(data: Omit<AuditLog, 'id' | 'data_hora'>): void {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      data_hora: new Date().toISOString(),
      ...data,
    };
    this.state.auditoria.unshift(log);
    // Keep max 250 audit entries in memory
    if (this.state.auditoria.length > 250) {
      this.state.auditoria = this.state.auditoria.slice(0, 250);
    }
    this.saveState();
  }

  // --- CONFIGURAÇÃO ---
  public getConfig(): OrganizacaoConfig {
    return { ...this.state.config };
  }

  public updateConfig(data: Partial<OrganizacaoConfig>, actor: { id: string; nome: string }): OrganizacaoConfig {
    this.state.config = {
      ...this.state.config,
      ...data,
    };

    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: 'Atualização de Configurações',
      entidade: 'configuracao',
      detalhes: 'Configurações organizacionais e financeiras atualizadas.',
    });

    this.saveState();
    return { ...this.state.config };
  }

  // --- UTILIZADORES / SESSÃO ---
  public getUsers(): User[] {
    return [...this.state.users];
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public updateUserPassword(userId: string, newPass: string, actor: { id: string; nome: string }): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    this.logAudit({
      utilizador_id: actor.id,
      utilizador_nome: actor.nome,
      acao: 'Alteração de Palavra-Passe',
      entidade: 'autenticacao',
      entidade_id: userId,
      detalhes: `Palavra-passe do utilizador ${user.nome} alterada com sucesso.`,
    });
    return true;
  }

  // Reset to factory mock data
  public resetData(): void {
    this.state = {
      users: INITIAL_USERS,
      motoristas: INITIAL_MOTORISTAS,
      quotas: INITIAL_QUOTAS,
      pagamentos: INITIAL_PAGAMENTOS,
      notificacoes: INITIAL_NOTIFICACOES,
      auditoria: INITIAL_AUDITORIA,
      config: DEFAULT_CONFIG,
    };
    this.recomputeAllQuotaStates();
    this.saveState();
  }
}

export const db = new DatabaseService();
