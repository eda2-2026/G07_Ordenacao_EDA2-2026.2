import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';
import { UsuarioLogado } from '../types';

const CHAVE = 'sra:usuario';

interface AuthContextValue {
  usuario: UsuarioLogado | null;
  entrar: (usuario: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function lerUsuarioSalvo(): UsuarioLogado | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as UsuarioLogado) : null;
  } catch {
    return null;
  }
}

function salvarUsuario(usuario: UsuarioLogado | null): void {
  try {
    if (usuario) window.localStorage.setItem(CHAVE, JSON.stringify(usuario));
    else window.localStorage.removeItem(CHAVE);
  } catch {
    return;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(lerUsuarioSalvo);

  const entrar = useCallback(async (nome: string, senha: string) => {
    const logado = await api.post<UsuarioLogado>('/api/login', { usuario: nome, senha });
    salvarUsuario(logado);
    setUsuario(logado);
  }, []);

  const sair = useCallback(() => {
    salvarUsuario(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, entrar, sair }), [usuario, entrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return contexto;
}
