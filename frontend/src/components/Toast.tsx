import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Icon } from './Icon';

type Tipo = 'success' | 'error' | 'info';

interface Mensagem {
  id: number;
  tipo: Tipo;
  texto: string;
}

interface ToastApi {
  success: (texto: string) => void;
  error: (texto: string) => void;
  info: (texto: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ESTILOS: Record<Tipo, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800'
};

const ICONES: Record<Tipo, 'check' | 'alert' | 'info'> = {
  success: 'check',
  error: 'alert',
  info: 'info'
};

let contador = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  const remover = useCallback((id: number) => {
    setMensagens((atual) => atual.filter((m) => m.id !== id));
  }, []);

  const adicionar = useCallback(
    (tipo: Tipo, texto: string) => {
      const id = ++contador;
      setMensagens((atual) => [...atual, { id, tipo, texto }]);
      window.setTimeout(() => remover(id), tipo === 'error' ? 6000 : 3500);
    },
    [remover]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (texto) => adicionar('success', texto),
      error: (texto) => adicionar('error', texto),
      info: (texto) => adicionar('info', texto)
    }),
    [adicionar]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {mensagens.map((m) => (
          <div
            key={m.id}
            className={`animate-slide-in pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${ESTILOS[m.tipo]}`}
          >
            <Icon name={ICONES[m.tipo]} className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="flex-1">{m.texto}</span>
            <button type="button" onClick={() => remover(m.id)} aria-label="Fechar" className="opacity-60 hover:opacity-100">
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return contexto;
}
