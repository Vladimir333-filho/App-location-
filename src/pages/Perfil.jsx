import { useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import FotoPerfil from '@/components/FotoPerfil';
import { ErroCaixa } from '@/components/Estados';
import { definirFoto, enviarFoto } from '@/lib/supabaseClient';
import { formatarTelefone } from '@/lib/format';
import { useSessao } from '@/lib/sessao';

const LIMITE = 5 * 1024 * 1024;

export default function Perfil() {
  const { perfil, nomeExibido, userId, administrador, recarregarPerfil } = useSessao();
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');
  const [feito, setFeito] = useState(false);
  const entrada = useRef(null);

  async function escolher(evento) {
    const ficheiro = evento.target.files?.[0];
    evento.target.value = '';
    if (!ficheiro) return;

    setErro('');
    setFeito(false);

    if (!String(ficheiro.type || '').startsWith('image/')) {
      setErro('Escolhe uma fotografia (JPG ou PNG).');
      return;
    }
    if (ficheiro.size > LIMITE) {
      setErro('A fotografia é muito grande. O máximo é 5 MB.');
      return;
    }

    setAEnviar(true);
    try {
      const extensao = /png/i.test(ficheiro.type) ? 'png' : 'jpg';
      const caminho = `${userId}/foto-${Date.now()}.${extensao}`;
      const endereco = await enviarFoto(ficheiro, caminho);
      await definirFoto(endereco);
      await recarregarPerfil();
      setFeito(true);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">O meu perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">A tua fotografia aparece no topo da app.</p>
      </div>

      <div className="card-suave flex flex-col items-center gap-3 p-6">
        <FotoPerfil nome={nomeExibido} fotoUrl={perfil?.foto} tamanho="lg" />

        <button
          onClick={() => entrada.current?.click()}
          disabled={aEnviar}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {aEnviar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {aEnviar ? 'A enviar…' : perfil?.foto ? 'Mudar fotografia' : 'Escolher fotografia'}
        </button>

        <input
          ref={entrada}
          type="file"
          accept="image/png,image/jpeg"
          onChange={escolher}
          className="hidden"
        />

        <p className="text-center text-[11px] leading-snug text-muted-foreground">
          JPG ou PNG, até 5 MB.
        </p>

        {feito && (
          <p className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" /> Fotografia atualizada.
          </p>
        )}
      </div>

      <ErroCaixa mensagem={erro} />

      <div className="card-suave divide-y divide-border/70 p-0">
        {[
          { rotulo: 'Nome', valor: nomeExibido },
          { rotulo: 'Telefone', valor: formatarTelefone(perfil?.telefone) },
          { rotulo: 'Perfil', valor: administrador ? 'Tesoureiro' : 'Motorista' },
        ].map(({ rotulo, valor }) => (
          <div key={rotulo} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</p>
            <p className="truncate text-sm font-semibold text-foreground">{valor || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}