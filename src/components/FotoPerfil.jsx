const TAMANHOS = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-16 w-16 text-lg',
  lg: 'h-28 w-28 text-3xl',
};

export default function FotoPerfil({ nome = '', fotoUrl = '', tamanho = 'md', className = '' }) {
  const iniciais =
    String(nome || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('') || '?';

  const base = `shrink-0 overflow-hidden rounded-full ${TAMANHOS[tamanho] || TAMANHOS.md} ${className}`;

  if (fotoUrl) {
    return <img src={fotoUrl} alt={nome || 'Fotografia de perfil'} className={`${base} object-cover`} />;
  }

  return (
    <span className={`${base} grid place-items-center bg-secondary font-heading font-extrabold text-primary`}>
      {iniciais}
    </span>
  );
}