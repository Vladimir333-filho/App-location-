import {
  BUCKET_COMPROVATIVOS,
  contarLinhas,
  enviarComprovativo,
  linkComprovativo,
  pedir,
  pedirTudo,
  registarConta,
} from '@/lib/supabaseClient';
import { validarComprovativo } from '@/lib/validarComprovativo';

export const QUOTA_SEMANAL_MAXIMA = 1000;
export const SEMANAS_DO_MES = 4;

export function limpo(valor) {
  return String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .trim();
}

export function escolher(linha, candidatos, defeito = null) {
  if (!linha) return defeito;
  for (const chave of candidatos) {
    const valor = linha[chave];
    if (valor !== undefined && valor !== null && valor !== '') return valor;
  }
  return defeito;
}

export function estadoQuota(valor, vencimento) {
  const texto = limpo(valor);
  if (texto.includes('pag') || texto.includes('quit') || texto.includes('liquid') || texto.includes('aprov')) return 'paga';
  if (texto.includes('analise') || texto.includes('comprov') || texto.includes('espera')) return 'em_analise';
  if (texto.includes('atras') || texto.includes('divida')) return 'atrasada';
  if (texto.includes('pend') || texto.includes('por_pagar') || texto.includes('abert')) return 'pendente';
  if (vencimento) {
    const data = new Date(`${String(vencimento).slice(0, 10)}T23:59:59`);
    if (!Number.isNaN(data.getTime()) && data.getTime() < Date.now()) return 'atrasada';
  }
  return 'pendente';
}

export function estadoPagamento(valor) {
  const texto = limpo(valor);
  if (texto.includes('aprov')) return 'aprovado';
  if (texto.includes('rejeit') || texto.includes('recus')) return 'rejeitado';
  if (texto.includes('pago') || texto.includes('confirm')) return 'aprovado';
  return 'em_analise';
}

function booleanoAtivo(linha) {
  const bruto = escolher(linha, ['ativo', 'activo', 'active', 'esta_ativo'], true);
  if (typeof bruto === 'string') return ['true', 'sim', '1', 'ativo', 'activo'].includes(limpo(bruto));
  return bruto !== false;
}

export function normalizarMotorista(linha) {
  const ativo = booleanoAtivo(linha);
  return {
    id: linha.id,
    utilizadorId: escolher(linha, ['user_id', 'utilizador_id', 'auth_id', 'user']),
    nome: escolher(linha, ['nome', 'nome_completo', 'name'], 'Sem nome'),
    telefone: escolher(linha, ['telefone', 'telemovel', 'numero', 'phone', 'contacto'], ''),
    foto: escolher(linha, ['foto_url', 'foto', 'avatar_url']),
    role: escolher(linha, ['role', 'perfil', 'funcao'], 'motorista'),
    ativo,
    bruto: linha,
  };
}

export function normalizarQuota(linha) {
  const vencimento = escolher(linha, ['vencimento', 'data_vencimento', 'prazo', 'due_date']);
  return {
    id: linha.id,
    motoristaId: escolher(linha, ['motorista_id', 'motoristaId', 'motorista']),
    referencia: escolher(linha, ['referencia', 'reference', 'descricao', 'periodo'], 'Quota'),
    valor: Number(escolher(linha, ['valor_kz', 'valor', 'montante', 'amount'], 0)) || 0,
    vencimento: vencimento ? String(vencimento).slice(0, 10) : null,
    estado: estadoQuota(escolher(linha, ['estado', 'status', 'situacao']), vencimento),
    criadoEm: escolher(linha, ['created_at', 'criado_em', 'data']),
  };
}

export function normalizarPagamento(linha) {
  return {
    id: linha.id,
    quotaId: escolher(linha, ['quota_id', 'quotaId', 'quota']),
    motoristaId: escolher(linha, ['motorista_id', 'motoristaId', 'motorista']),
    valor: Number(escolher(linha, ['valor_kz', 'valor_pago', 'valor', 'montante'], 0)) || 0,
    comprovativo: escolher(linha, ['comprovativo_path', 'comprovativo', 'comprovativo_url', 'ficheiro']),
    estado: estadoPagamento(escolher(linha, ['estado', 'status', 'situacao'])),
    motivo: escolher(linha, ['motivo_rejeicao', 'motivo', 'observacoes', 'nota']),
    criadoEm: escolher(linha, ['created_at', 'data_pagamento', 'criado_em', 'data']),
  };
}

export async function listarMotoristas() {
  const linhas = await pedirTudo('motoristas', 'select=*');
  return (Array.isArray(linhas) ? linhas : []).map(normalizarMotorista);
}

export async function listarQuotas() {
  const linhas = await pedirTudo('quotas', 'select=*');
  return (Array.isArray(linhas) ? linhas : []).map(normalizarQuota);
}

export async function listarPagamentos() {
  const linhas = await pedirTudo('pagamentos', 'select=*');
  return (Array.isArray(linhas) ? linhas : []).map(normalizarPagamento);
}

export async function quotasDoMotorista(motoristaId) {
  const linhas = await pedirTudo('quotas', `select=*&motorista_id=eq.${motoristaId}`);
  return (Array.isArray(linhas) ? linhas : [])
    .map(normalizarQuota)
    .sort((a, b) => String(b.vencimento || '').localeCompare(String(a.vencimento || '')));
}

export async function pagamentosDoMotorista(motoristaId) {
  const linhas = await pedirTudo('pagamentos', `select=*&motorista_id=eq.${motoristaId}`);
  return (Array.isArray(linhas) ? linhas : [])
    .map(normalizarPagamento)
    .sort((a, b) => String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')));
}

export async function atualizarEstadoQuota(quotaId, estado) {
  await pedir('quotas', {
    metodo: 'PATCH',
    query: `id=eq.${quotaId}`,
    corpo: { estado },
    prefer: 'return=minimal',
  });
}

export async function submeterComprovativo({ quota, motoristaId, valorPago, ficheiro }) {
  // Segunda barreira: mesmo que a página falhe, o ficheiro tem de cumprir a regra.
  await validarComprovativo(ficheiro);

  const caminho = `${motoristaId}/${quota.id}-${Date.now()}.pdf`;
  await enviarComprovativo(ficheiro, caminho);

  const corpo = {
    quota_id: quota.id,
    motorista_id: motoristaId,
    valor_kz: valorPago,
    comprovativo_path: caminho,
    estado: 'em_analise',
  };

  await pedir('pagamentos', { metodo: 'POST', corpo: [corpo], prefer: 'return=minimal' });
  await atualizarEstadoQuota(quota.id, 'em_analise');
  return caminho;
}

export async function aprovarPagamento(pagamento) {
  await pedir('pagamentos', {
    metodo: 'PATCH',
    query: `id=eq.${pagamento.id}`,
    corpo: { estado: 'aprovado' },
    prefer: 'return=minimal',
  });
  if (pagamento.quotaId) await atualizarEstadoQuota(pagamento.quotaId, 'paga');
}

export async function rejeitarPagamento(pagamento, motivo) {
  await pedir('pagamentos', {
    metodo: 'PATCH',
    query: `id=eq.${pagamento.id}`,
    corpo: { estado: 'rejeitado', motivo_rejeicao: motivo },
    prefer: 'return=minimal',
  });
  if (pagamento.quotaId) await atualizarEstadoQuota(pagamento.quotaId, 'pendente');
}

export async function criarRegistoMotorista({ nome, telefone, role = 'motorista', utilizadorId }) {
  const corpo = { nome, telefone, role, ativo: true };
  if (utilizadorId) corpo.id = utilizadorId;

  // O trigger do Supabase pode já ter criado o perfil: nesse caso actualiza em vez de falhar.
  const resultado = await pedir('motoristas', {
    metodo: 'POST',
    query: utilizadorId ? 'on_conflict=id' : '',
    corpo: [corpo],
    prefer: 'return=representation,resolution=merge-duplicates',
  });
  return Array.isArray(resultado) ? resultado[0] : resultado;
}

export async function criarMotorista({ nome, telefone, palavraPasse, role }) {
  let utilizadorId = null;

  try {
    // Conta criada sem trocar a sessão de quem está a usar o painel (o admin).
    const { utilizador } = await registarConta(telefone, palavraPasse, nome, { manterSessao: false });
    utilizadorId = utilizador?.id || null;
  } catch (falha) {
    if (!falha.jaExiste) throw falha;
    // Nunca redefinir silenciosamente a palavra-passe de uma conta já existente.
    throw new Error('Este número já tem uma conta de autenticação. Se estiver sem perfil, usa a opção "Recuperar" na gestão de motoristas; caso contrário, edita o perfil existente.');
  }

  return criarRegistoMotorista({ nome, telefone, role, utilizadorId });
}

export async function atualizarMotorista(motorista, alteracoes) {
  const corpo = {};
  ['nome', 'telefone', 'role', 'ativo'].forEach((campo) => {
    if (alteracoes[campo] !== undefined) corpo[campo] = alteracoes[campo];
  });
  return pedir('motoristas', {
    metodo: 'PATCH',
    query: `id=eq.${motorista.id}`,
    corpo,
    prefer: 'return=minimal',
  });
}

export async function gerarQuotas({ referencia, valor, vencimento, motoristas }) {
  if (motoristas.length === 0) return 0;

  // A tabela tem chave única (motorista_id, referencia): só criamos para quem ainda não a tem.
  const existentes = await pedirTudo(
    'quotas',
    `select=motorista_id&referencia=eq.${encodeURIComponent(referencia)}`,
  );
  const jaTem = new Set(
    (Array.isArray(existentes) ? existentes : []).map((linha) => String(linha.motorista_id)),
  );

  const corpo = motoristas
    .filter((motorista) => !jaTem.has(String(motorista.id)))
    .map((motorista) => ({
      motorista_id: motorista.id,
      referencia,
      valor_kz: Number(valor),
      vencimento,
      estado: 'pendente',
    }));

  if (corpo.length === 0) return 0;

  await pedir('quotas', { metodo: 'POST', corpo, prefer: 'return=minimal' });
  return corpo.length;
}

function explicarFalhaAoCancellar(tabela, falha) {
  const texto = String(falha?.message || '').toLowerCase();
  if (texto.includes('foreign key') || texto.includes('violates') || texto.includes('23503')) {
    const auditado = texto.includes('auditoria');
    return new Error(
      auditado
        ? 'A base de dados guarda auditoria destes pagamentos e não deixou apagar. É preciso autorizar o DELETE na tabela "auditoria_pagamentos".'
        : 'Estes registos têm histórico ligado na base de dados e não podem ser apagados enquanto ele existir.',
    );
  }
  const detalhe = String(falha?.message || '').trim();
  return new Error(
    `A base de dados não deixou apagar em "${tabela}".${detalhe ? ` (${detalhe})` : ''} No Supabase, a tabela precisa de uma política de DELETE para utilizadores com sessão.`,
  );
}

// A tabela de auditoria é opcional: se ainda não existir no Supabase, a sua
// ausência não pode impedir a eliminação de quotas ou motoristas.
async function limparAuditoria(idsPagamentos) {
  if (!Array.isArray(idsPagamentos) || idsPagamentos.length === 0) return;
  try {
    await pedir('auditoria_pagamentos', {
      metodo: 'DELETE',
      query: `pagamento_id=in.(${idsPagamentos.join(',')})`,
      prefer: 'return=minimal',
    });
  } catch {
    /* tabela opcional */
  }
}

export async function eliminarQuotas(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const filtro = `id=in.(${ids.map((id) => String(id)).join(',')})`;

  // Os comprovativos (e a auditoria deles) apontam para estas quotas: saem primeiro.
  const pagamentosLigados = await pedirTudo(
    'pagamentos',
    `select=id&quota_id=in.(${ids.map((id) => String(id)).join(',')})`,
  );
  const idsPagamentos = (Array.isArray(pagamentosLigados) ? pagamentosLigados : []).map((linha) => linha.id);
  if (idsPagamentos.length > 0) {
    await limparAuditoria(idsPagamentos);
    await pedir('pagamentos', {
      metodo: 'DELETE',
      query: `id=in.(${idsPagamentos.join(',')})`,
      prefer: 'return=minimal',
    });
  }

  let apagadas;
  try {
    apagadas = await pedir('quotas', { metodo: 'DELETE', query: filtro, prefer: 'return=representation' });
  } catch (falha) {
    throw explicarFalhaAoCancellar('quotas', falha);
  }

  const total = Array.isArray(apagadas) ? apagadas.length : 0;
  if (total > 0) return total;

  // Sem linhas devolvidas: confirmamos se ficaram na tabela antes de dizer que apagou.
  const restantes = await pedir('quotas', { query: `select=id&${filtro}&limit=1000` });
  if (Array.isArray(restantes) && restantes.length > 0) {
    throw explicarFalhaAoCancellar('quotas', null);
  }
  return 0;
}

export async function eliminarMotorista(motoristaId) {
  // Eliminação lógica: preserva quotas, pagamentos, comprovativos e auditoria.
  // Nunca apagar o perfil antes da conta Auth: isso criava contas órfãs.
  if (!motoristaId) throw new Error('Identificador do motorista inválido.');

  const resultado = await pedir('motoristas', {
    metodo: 'PATCH',
    query: `id=eq.${motoristaId}`,
    corpo: { ativo: false },
    prefer: 'return=representation',
  });

  if (Array.isArray(resultado) && resultado.length === 0) {
    throw new Error('Não foi possível desactivar o motorista. Confirma as permissões e tenta novamente.');
  }
  return Array.isArray(resultado) ? resultado.length : 1;
}

export async function contarPagamentosEmAnalise() {
  return contarLinhas('pagamentos', 'estado=eq.em_analise');
}

export async function linkDoComprovativo(caminho) {
  if (!caminho) return null;
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return linkComprovativo(String(caminho).replace(new RegExp(`^${BUCKET_COMPROVATIVOS}/`), ''));
}

export function descarregarCsv(nomeFicheiro, linhas) {
  const conteudo = linhas
    .map((linha) => linha.map((campo) => `"${String(campo ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob([`\ufeff${conteudo}`], { type: 'text/csv;charset=utf-8;' });
  const endereco = URL.createObjectURL(blob);
  const elemento = document.createElement('a');
  elemento.href = endereco;
  elemento.download = nomeFicheiro;
  document.body.appendChild(elemento);
  elemento.click();
  document.body.removeChild(elemento);
  URL.revokeObjectURL(endereco);
}