import { jsPDF } from 'jspdf';
import { formatKz, formatData } from '@/lib/format';

export function descarregarRecibo({ motorista, quota, pagamento }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const largura = doc.internal.pageSize.getWidth();

  doc.setFillColor(11, 37, 69);
  doc.rect(0, 0, largura, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('QuotaMob', 12, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Comprovativo de pagamento de quota', 12, 21);

  const rotuloEstado =
    pagamento.estado === 'aprovado' ? 'Aprovado' : pagamento.estado === 'rejeitado' ? 'Rejeitado' : 'Em análise';

  doc.setTextColor(20, 30, 45);
  let y = 40;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Pagamento ${rotuloEstado.toLowerCase()}`, 12, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const linhas = [
    ['Motorista', motorista?.nome || '—'],
    ['Telefone', motorista?.telefone ? `+244 ${motorista.telefone}` : '—'],
    ['Referência', quota?.referencia || '—'],
    ['Vencimento', formatData(quota?.vencimento)],
    ['Valor da quota', formatKz(quota?.valor)],
    ['Valor pago', formatKz(pagamento.valor)],
    ['Data do pagamento', formatData(pagamento.criadoEm)],
    ['Estado', rotuloEstado],
  ];

  linhas.forEach(([rotulo, valor]) => {
    doc.setTextColor(110, 122, 140);
    doc.text(rotulo, 12, y);
    doc.setTextColor(20, 30, 45);
    doc.text(String(valor), largura - 12, y, { align: 'right' });
    y += 7;
  });

  y += 4;
  doc.setDrawColor(220, 226, 235);
  doc.line(12, y, largura - 12, y);
  y += 8;
  doc.setFontSize(7.5);
  doc.setTextColor(120, 132, 150);
  doc.text(`Documento gerado a ${formatData(new Date())} pela app QuotaMob.`, 12, y);

  const ficheiro = `recibo-${String(quota?.referencia || 'quota').replace(/[^\w-]+/g, '-').toLowerCase()}.pdf`;
  doc.save(ficheiro);
}