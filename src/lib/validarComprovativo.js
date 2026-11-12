// Regra única do comprovativo aceite pela QuotaMob.
// Um só formato e um só tamanho: serve para travar ficheiros falsos
// (imagem renomeada para .pdf, PDF cortado, PDF protegido) e recibos enormes.
export const COMPROVATIVO = {
  formato: 'PDF',
  menor: 10 * 1024,
  maior: 2 * 1024 * 1024,
};

export function tamanhoLegivel(bytes) {
  const valor = Number(bytes) || 0;
  if (valor < 1024 * 1024) return `${Math.max(1, Math.round(valor / 1024))} KB`;
  return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
}

function lerTexto(bytes) {
  return new TextDecoder('latin1').decode(bytes);
}

export async function validarComprovativo(ficheiro) {
  if (!ficheiro) {
    throw new Error('Anexa o comprovativo do pagamento em PDF.');
  }

  if (!/\.pdf$/i.test(String(ficheiro.name || ''))) {
    throw new Error('O comprovativo tem de ser um ficheiro PDF. Imagens e capturas de ecrã não são aceites.');
  }

  if (ficheiro.size > COMPROVATIVO.maior) {
    throw new Error(`O PDF tem ${tamanhoLegivel(ficheiro.size)}. O máximo aceito é 2 MB.`);
  }

  if (ficheiro.size < COMPROVATIVO.menor) {
    throw new Error('Este PDF está vazio ou incompleto. Descarrega outra vez o comprovativo do Multicaixa Express.');
  }

  const bytes = new Uint8Array(await ficheiro.arrayBuffer());

  // Assinatura verdadeira de um PDF: os primeiros bytes são "%PDF-".
  if (!lerTexto(bytes.subarray(0, 8)).startsWith('%PDF-')) {
    throw new Error('Este ficheiro não é um PDF verdadeiro. O comprovativo tem de sair do Multicaixa Express em PDF.');
  }

  const completo = lerTexto(bytes);

  // Um PDF inteiro fecha com "%%EOF". Sem isso foi cortado ou montado à mão.
  if (!completo.trimEnd().endsWith('%%EOF')) {
    throw new Error('O PDF está incompleto (foi cortado ou alterado). Descarrega-o outra vez.');
  }

  if (completo.includes('/Encrypt')) {
    throw new Error('O PDF está protegido por palavra-passe. Envia um comprovativo que se possa abrir.');
  }

  return { bytes: ficheiro.size, legivel: tamanhoLegivel(ficheiro.size) };
}