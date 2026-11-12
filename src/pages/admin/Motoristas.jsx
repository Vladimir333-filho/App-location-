import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Loader2, Pencil, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react';
import ReporPalavraPasse from '@/components/admin/ReporPalavraPasse';
import { Carregando, ErroCaixa, Vazio } from '@/components/Estados';
import { atualizarMotorista, criarMotorista, eliminarMotorista, listarMotoristas } from '@/lib/dados';
import { formatarTelefone, limparTelefone } from '@/lib/format';

const NOVO = { nome: '', telefone: '', palavraPasse: '', role: 'motorista' };

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [aGravar, setAGravar] = useState(false);
  const [criado, setCriado] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [aApagar, setAApagar] = useState(false);
  const [aReporSenha, setAReporSenha] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      setMotoristas(await listarMotoristas());
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return motoristas;
    return motoristas.filter(
      (motorista) =>
        String(motorista.nome).toLowerCase().includes(termo) || String(motorista.telefone).includes(termo),
    );
  }, [motoristas, pesquisa]);

  async function gravar(manterAberto = false) {
    setErro('');
    setCriado('');
    const telefone = limparTelefone(formulario.telefone);
    if (!formulario.nome.trim()) {
      setErro('Escreve o nome do motorista.');
      return;
    }
    if (telefone.length !== 9) {
      setErro('O telefone deve ter 9 dígitos (ex.: 923456789).');
      return;
    }
    if (!formulario.id && formulario.palavraPasse.length < 6) {
      setErro('A palavra-passe inicial deve ter pelo menos 6 caracteres.');
      return;
    }

    setAGravar(true);
    try {
      if (formulario.id) {
        await atualizarMotorista(formulario, {
          nome: formulario.nome.trim(),
          telefone,
          role: formulario.role,
          ativo: formulario.ativo,
        });
        setFormulario(null);
      } else {
        await criarMotorista({
          nome: formulario.nome.trim(),
          telefone,
          palavraPasse: formulario.palavraPasse,
          role: formulario.role,
        });
        if (manterAberto) {
          setFormulario({ ...NOVO });
          setCriado(`${formulario.nome.trim()} criado. Escreve os dados do próximo motorista.`);
        } else {
          setFormulario(null);
        }
      }
      await carregar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAGravar(false);
    }
  }

  async function eliminar() {
    setErro('');
    setAApagar(true);
    try {
      await eliminarMotorista(aEliminar.id);
      setMotoristas((anteriores) => anteriores.filter((item) => item.id !== aEliminar.id));
      setAEliminar(null);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAApagar(false);
    }
  }

  async function alternarAtivo(motorista) {
    setErro('');
    try {
      await atualizarMotorista(motorista, { ativo: !motorista.ativo });
      setMotoristas((anteriores) =>
        anteriores.map((item) => (item.id === motorista.id ? { ...item, ativo: !item.ativo } : item)),
      );
    } catch (falha) {
      setErro(falha.message);
    }
  }

  if (carregando) return <Carregando texto="A carregar motoristas…" />;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Motoristas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{motoristas.length} registados</p>
        </div>
        <button
          onClick={() => {
            setCriado('');
            setErro('');
            setFormulario({ ...NOVO });
          }}
          className="flex h-11 items-center gap-1.5 rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-white px-3 ring-1 ring-border/70">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Procurar por nome ou telefone"
          className="h-12 w-full bg-transparent text-sm outline-none"
        />
      </div>

      <ErroCaixa mensagem={erro} aoTentar={carregar} />

      {filtrados.length === 0 ? (
        <Vazio icone={Users} titulo="Sem motoristas" texto="Cria o primeiro motorista para começar a gerar quotas." />
      ) : (
        <div className="space-y-2">
          {filtrados.map((motorista) => (
            <div key={motorista.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-border/70">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-heading text-sm font-extrabold text-primary">
                {String(motorista.nome).slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{motorista.nome}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  +244 {formatarTelefone(motorista.telefone)} · {String(motorista.role).toLowerCase().includes('admin') ? 'Admin' : 'Motorista'}
                </p>
              </div>
              <button
                onClick={() => alternarAtivo(motorista)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
                  motorista.ativo ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-muted text-muted-foreground ring-border'
                }`}
              >
                {motorista.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <button
                onClick={() => {
                  setErro('');
                  setAReporSenha(motorista);
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
                aria-label="Repor palavra-passe"
              >
                <KeyRound className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setCriado('');
                  setErro('');
                  setFormulario({
                    id: motorista.id,
                    nome: motorista.nome,
                    telefone: motorista.telefone,
                    role: String(motorista.role).toLowerCase().includes('admin') ? 'admin' : 'motorista',
                    ativo: motorista.ativo,
                    palavraPasse: '',
                  });
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
                aria-label="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setAEliminar(motorista)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-600"
                aria-label="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {formulario && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-4 backdrop-blur-sm">
          <div className="animar-surgir max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-foreground">
                {formulario.id ? 'Editar motorista' : 'Novo motorista'}
              </h2>
            </div>

            <Campo rotulo="Nome completo">
              <input
                value={formulario.nome}
                onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
                className="h-12 w-full rounded-2xl border border-input px-3 text-sm outline-none focus:border-primary"
              />
            </Campo>

            <Campo rotulo="Telefone (9 dígitos)">
              <input
                value={formulario.telefone}
                onChange={(e) => setFormulario({ ...formulario, telefone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                inputMode="numeric"
                placeholder="923456789"
                className="h-12 w-full rounded-2xl border border-input px-3 text-sm outline-none focus:border-primary"
              />
            </Campo>

            {!formulario.id && (
              <Campo rotulo="Palavra-passe inicial">
                <input
                  value={formulario.palavraPasse}
                  onChange={(e) => setFormulario({ ...formulario, palavraPasse: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-input px-3 text-sm outline-none focus:border-primary"
                />
              </Campo>
            )}

            <Campo rotulo="Perfil">
              <div className="grid grid-cols-2 gap-2">
                {['motorista', 'admin'].map((opcao) => (
                  <button
                    key={opcao}
                    onClick={() => setFormulario({ ...formulario, role: opcao })}
                    className={`h-11 rounded-2xl text-xs font-bold capitalize transition ${
                      formulario.role === opcao ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </Campo>

            {formulario.id && (
              <button
                onClick={() => setFormulario({ ...formulario, ativo: !formulario.ativo })}
                className="mb-3 flex w-full items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm font-semibold text-foreground"
              >
                Conta ativa
                <span className={`h-6 w-11 rounded-full p-0.5 transition ${formulario.ativo ? 'bg-success' : 'bg-border'}`}>
                  <span className={`block h-5 w-5 rounded-full bg-white transition ${formulario.ativo ? 'translate-x-5' : ''}`} />
                </span>
              </button>
            )}

            {criado && (
              <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">{criado}</p>
            )}

            {erro && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{erro}</p>}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setFormulario(null)} className="h-12 rounded-2xl bg-muted text-sm font-bold text-foreground">
                Cancelar
              </button>
              <button
                onClick={() => gravar(false)}
                disabled={aGravar}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {aGravar && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>

            {!formulario.id && (
              <button
                onClick={() => gravar(true)}
                disabled={aGravar}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 text-sm font-bold text-primary disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Guardar e adicionar outro
              </button>
            )}
          </div>
        </div>
      )}

      <ReporPalavraPasse motorista={aReporSenha} aoFechar={() => setAReporSenha(null)} />

      {aEliminar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-4 backdrop-blur-sm">
          <div className="animar-surgir w-full max-w-md rounded-3xl bg-white p-5">
            <h2 className="font-heading text-lg font-bold text-foreground">Eliminar motorista?</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{aEliminar.nome}</span> sai da lista e as quotas e comprovativos
              ligados a ele também são apagados. Esta acção não se pode desfazer.
            </p>

            {erro && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{erro}</p>}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setAEliminar(null)}
                className="h-12 rounded-2xl bg-muted text-sm font-bold text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={eliminar}
                disabled={aApagar}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-bold text-white disabled:opacity-60"
              >
                {aApagar && <Loader2 className="h-4 w-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ rotulo, children }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</span>
      {children}
    </label>
  );
}