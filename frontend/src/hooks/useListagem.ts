import { useCallback, useMemo, useState } from 'react';
import { qs } from '../api/client';
import { Pagina } from '../types';
import { useDebounce } from './useDebounce';
import { FetchState, useFetch } from './useFetch';

export type Filtros = Record<string, string>;

export interface Ordenacao {
  campo: string;
  ordem: 'asc' | 'desc';
}

export interface Listagem<T> extends FetchState<Pagina<T>> {
  filtros: Filtros;
  pagina: number;
  ordenacao: Ordenacao | null;
  definirFiltro: (chave: string, valor: string) => void;
  limparFiltros: () => void;
  irParaPagina: (pagina: number) => void;
  alternarOrdenacao: (campo: string) => void;
  temFiltroAtivo: boolean;
}

export function useListagem<T>(
  endpoint: string,
  filtrosIniciais: Filtros,
  limite = 20,
  ordenacaoInicial: Ordenacao | null = null
): Listagem<T> {
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);
  const [pagina, setPagina] = useState(1);
  const [ordenacao, setOrdenacao] = useState<Ordenacao | null>(ordenacaoInicial);
  const buscaDebounced = useDebounce(filtros.busca ?? '');

  const url = useMemo(() => {
    return (
      endpoint +
      qs({
        ...filtros,
        busca: buscaDebounced,
        pagina,
        limite,
        ordenarPor: ordenacao?.campo,
        ordem: ordenacao?.ordem
      })
    );
  }, [endpoint, filtros, buscaDebounced, pagina, limite, ordenacao]);

  const fetchState = useFetch<Pagina<T>>(url);

  const definirFiltro = useCallback((chave: string, valor: string) => {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
    setPagina(1);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros(filtrosIniciais);
    setPagina(1);
  }, [filtrosIniciais]);

  const alternarOrdenacao = useCallback((campo: string) => {
    setOrdenacao((atual) => {
      if (!atual || atual.campo !== campo) return { campo, ordem: 'asc' };
      if (atual.ordem === 'asc') return { campo, ordem: 'desc' };
      return null;
    });
    setPagina(1);
  }, []);

  const temFiltroAtivo = Object.entries(filtros).some(([chave, valor]) => valor !== (filtrosIniciais[chave] ?? ''));

  return {
    ...fetchState,
    filtros,
    pagina,
    ordenacao,
    definirFiltro,
    limparFiltros,
    irParaPagina: setPagina,
    alternarOrdenacao,
    temFiltroAtivo
  };
}
