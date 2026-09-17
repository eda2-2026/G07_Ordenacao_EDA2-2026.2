import { ReactNode, useEffect } from 'react';
import { Icon } from './Icon';
import { Button } from './ui';

interface ModalProps {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: 'md' | 'lg' | 'xl';
}

const LARGURAS = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ aberto, titulo, onFechar, children, rodape, largura = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className={`animate-fade-in my-8 w-full ${LARGURAS[largura]} rounded-2xl bg-white shadow-2xl`}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Icon name="x" />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
        {rodape && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 rounded-b-2xl">{rodape}</footer>}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: ReactNode;
  textoConfirmar?: string;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({ aberto, titulo, mensagem, textoConfirmar = 'Excluir', carregando, onConfirmar, onCancelar }: ConfirmDialogProps) {
  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      onFechar={onCancelar}
      largura="md"
      rodape={
        <>
          <Button variante="secondary" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button variante="danger" onClick={onConfirmar} carregando={carregando} icone="trash">
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Icon name="alert" />
        </div>
        <div className="text-sm text-slate-600">{mensagem}</div>
      </div>
    </Modal>
  );
}
