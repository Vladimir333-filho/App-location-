// Número do tesoureiro que repõe palavras-passe (com indicativo, sem espaços).
// Exemplo: '244923456789'. Vazio = a app só mostra as instruções.
export const TELEFONE_SUPORTE = '244937801217';

export function linkWhatsApp(mensagem) {
  if (!TELEFONE_SUPORTE) return null;
  return `https://wa.me/${TELEFONE_SUPORTE}?text=${encodeURIComponent(mensagem)}`;
}