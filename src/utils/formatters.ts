export function formatMoney(amount: number, symbol: string = 'Kz'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0,00 ${symbol}`;
  }
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${symbol}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('T')[0].split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-AO');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('pt-AO')} às ${d.toLocaleTimeString('pt-AO', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return dateString;
  }
}

export function getQuotaStatusLabel(status: string): { label: string; bgClass: string; textClass: string; dotClass: string } {
  switch (status) {
    case 'paga':
      return {
        label: 'Paga',
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        textClass: 'text-emerald-700 dark:text-emerald-300',
        dotClass: 'bg-emerald-500',
      };
    case 'parcialmente_paga':
      return {
        label: 'Parcial',
        bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        textClass: 'text-blue-700 dark:text-blue-300',
        dotClass: 'bg-blue-500',
      };
    case 'pendente':
      return {
        label: 'Pendente',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        textClass: 'text-amber-700 dark:text-amber-300',
        dotClass: 'bg-amber-500',
      };
    case 'vencida':
      return {
        label: 'Vencida / Atraso',
        bgClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
        textClass: 'text-rose-700 dark:text-rose-300',
        dotClass: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        bgClass: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        textClass: 'text-slate-700 dark:text-slate-300',
        dotClass: 'bg-slate-400',
      };
  }
}

export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'multicaixa_express':
      return 'Multicaixa Express';
    case 'transferencia':
      return 'Transferência Bancária';
    case 'dinheiro':
      return 'Dinheiro (Espécie)';
    case 'outro':
      return 'Outro Método';
    default:
      return method;
  }
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const processCell = (cell: string | number) => {
    let str = cell === null || cell === undefined ? '' : String(cell);
    str = str.replace(/"/g, '""');
    if (str.search(/("|,|\n)/g) >= 0) {
      str = `"${str}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(processCell).join(','),
    ...rows.map((row) => row.map(processCell).join(',')),
  ].join('\r\n');

  // Add BOM for Excel UTF-8 recognition
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
