import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useFetch<T>(url: string | null): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(url !== null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const ultima = useRef(0);

  useEffect(() => {
    if (url === null) {
      setLoading(false);
      return;
    }
    const chamada = ++ultima.current;
    setLoading(true);
    setError(null);
    api
      .get<T>(url)
      .then((resultado) => {
        if (chamada !== ultima.current) return;
        setData(resultado);
        setLoading(false);
      })
      .catch((erro: unknown) => {
        if (chamada !== ultima.current) return;
        setError(erro instanceof ApiError ? erro.message : 'Erro inesperado');
        setLoading(false);
      });
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, reload };
}
