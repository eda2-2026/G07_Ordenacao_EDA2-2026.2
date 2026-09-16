import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Opcoes } from '../types';

let cache: Opcoes | null = null;
let pendente: Promise<Opcoes> | null = null;

export function invalidarOpcoes(): void {
  cache = null;
  pendente = null;
}

function carregar(): Promise<Opcoes> {
  if (cache) return Promise.resolve(cache);
  if (!pendente) {
    pendente = api.get<Opcoes>('/api/opcoes').then((opcoes) => {
      cache = opcoes;
      return opcoes;
    });
    pendente.catch(() => {
      pendente = null;
    });
  }
  return pendente;
}

export function useOpcoes(): Opcoes | null {
  const [opcoes, setOpcoes] = useState<Opcoes | null>(cache);
  useEffect(() => {
    let ativo = true;
    carregar()
      .then((resultado) => {
        if (ativo) setOpcoes(resultado);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);
  return opcoes;
}
