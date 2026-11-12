import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  apagarSessao,
  lerSessao,
  pedir,
  sairDoServidor,
  sessaoValida,
} from '@/lib/supabaseClient';
import {
  iniciarSessaoComMfa,
  verificarMfaLogin,
  sessaoMfaExigeDesafio,
} from '@/lib/mfa';
import { ligacaoConfigurada } from '@/lib/supabaseConfig';
import { normalizarMotorista } from '@/lib/dados';

const SessaoContext = createContext(null);

export function ehAdmin(perfil) {
  return String(perfil?.role || '').toLowerCase().includes('admin');
}

export function SessaoProvider({ children }) {
  const [estado, setEstado] = useState('a_carregar');
  const [sessao, setSessao] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [erroPerfil, setErroPerfil] = useState('');

  const carregarPerfil = useCallback(async (userId) => {
    if (!userId) return null;
    const linhas = await pedir('motoristas', { query: `select=*&id=eq.${userId}&limit=1` });
    const linha = Array.isArray(linhas) ? linhas[0] || null : null;
    return linha ? normalizarMotorista(linha) : null;
  }, []);

  const assumirSessao = useCallback(async (novaSessao) => {
    setSessao(novaSessao);
    setErroPerfil('');
    try {
      const encontrado = await carregarPerfil(novaSessao.utilizador?.id);
      setPerfil(encontrado);
    } catch (erro) {
      setPerfil(null);
      setErroPerfil(erro.message);
    }
    setEstado('pronto');
  }, [carregarPerfil]);

  useEffect(() => {
    let vivo = true;
    async function arrancar() {
      if (!ligacaoConfigurada()) {
        if (vivo) setEstado('sem_ligacao');
        return;
      }
      const guardada = lerSessao();
      if (!guardada) {
        if (vivo) setEstado('sem_sessao');
        return;
      }
      const valida = await sessaoValida();
      if (!vivo) return;
      if (!valida) {
        setEstado('sem_sessao');
        return;
      }
      try {
        if (await sessaoMfaExigeDesafio(valida)) {
          apagarSessao();
          setEstado('sem_sessao');
          return;
        }
      } catch {
        setEstado('sem_sessao');
        return;
      }
      await assumirSessao(valida);
    }
    arrancar();
    return () => { vivo = false; };
  }, [assumirSessao]);

  const entrar = useCallback(async (telefone, palavraPasse) => {
    const resultado = await iniciarSessaoComMfa(telefone, palavraPasse);
    if (resultado.mfaRequired) return resultado;
    await assumirSessao(resultado.sessao);
    return { mfaRequired: false };
  }, [assumirSessao]);

  const confirmarMfaLogin = useCallback(async (desafio, codigo) => {
    const novaSessao = await verificarMfaLogin({ ...desafio, codigo });
    await assumirSessao(novaSessao);
  }, [assumirSessao]);

  const sair = useCallback(async () => {
    await sairDoServidor();
    apagarSessao();
    setSessao(null);
    setPerfil(null);
    setErroPerfil('');
    setEstado('sem_sessao');
  }, []);

  const recarregarPerfil = useCallback(async () => {
    if (!sessao?.utilizador?.id) return;
    const encontrado = await carregarPerfil(sessao.utilizador.id);
    setPerfil(encontrado);
  }, [sessao, carregarPerfil]);

  const valor = useMemo(() => ({
    estado,
    sessao,
    perfil,
    erroPerfil,
    entrar,
    confirmarMfaLogin,
    sair,
    recarregarPerfil,
    administrador: ehAdmin(perfil),
    userId: sessao?.utilizador?.id || null,
    nomeExibido: perfil?.nome || perfil?.nome_completo || perfil?.name || 'Motorista',
  }), [estado, sessao, perfil, erroPerfil, entrar, confirmarMfaLogin, sair, recarregarPerfil]);

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao() {
  const contexto = useContext(SessaoContext);
  if (!contexto) throw new Error('useSessao tem de estar dentro do SessaoProvider.');
  return contexto;
}
