import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, forwardRef } from 'react';
import { Icon, IconName } from './Icon';

type Variante = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTES: Record<Variante, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400'
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  icone?: IconName;
  carregando?: boolean;
}

export function Button({ variante = 'primary', icone, carregando, children, className = '', disabled, ...resto }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${className}`}
      {...resto}
    >
      {carregando ? <Spinner className="h-4 w-4" /> : icone ? <Icon name={icone} className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  icone,
  titulo,
  tom = 'slate',
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & { icone: IconName; titulo: string; tom?: 'slate' | 'rose' | 'brand' }) {
  const tons = {
    slate: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
    rose: 'text-slate-500 hover:bg-rose-50 hover:text-rose-600',
    brand: 'text-slate-500 hover:bg-brand-50 hover:text-brand-600'
  };
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      className={`rounded-md p-1.5 transition focus-visible:outline-2 focus-visible:outline-brand-500 ${tons[tom]}`}
      {...resto}
    >
      <Icon name={icone} className="h-4 w-4" />
    </button>
  );
}

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-label="Carregando">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Card({
  titulo,
  subtitulo,
  acoes,
  children,
  className = '',
  semPadding = false
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
  semPadding?: boolean;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(titulo || acoes) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            {titulo && <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
          </div>
          {acoes}
        </header>
      )}
      <div className={semPadding ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

const TONS_BADGE: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20'
};

const TOM_POR_STATUS: Record<string, keyof typeof TONS_BADGE> = {
  Aprovado: 'green',
  Ativo: 'green',
  Ativa: 'green',
  Recuperação: 'amber',
  Trancado: 'amber',
  Afastado: 'amber',
  Reprovado: 'red',
  'Reprovado por Frequência': 'orange',
  Inativo: 'slate',
  Inativa: 'slate'
};

export function Badge({ children, tom }: { children: ReactNode; tom?: keyof typeof TONS_BADGE }) {
  const chave = tom ?? (typeof children === 'string' ? (TOM_POR_STATUS[children] ?? 'slate') : 'slate');
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONS_BADGE[chave]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: string; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

export function StatCard({
  rotulo,
  valor,
  detalhe,
  icone,
  tom = 'brand'
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  icone: IconName;
  tom?: 'brand' | 'green' | 'amber' | 'red' | 'sky' | 'violet';
}) {
  const tons = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600'
  };
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tons[tom]}`}>
        <Icon name={icone} className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{rotulo}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{valor}</p>
        {detalhe && <p className="text-xs text-slate-400">{detalhe}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name="search" className="h-6 w-6" />
      </div>
      <p className="font-medium text-slate-700">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-slate-500">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function ErrorState({ mensagem, onRetry }: { mensagem: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <Icon name="alert" className="h-6 w-6" />
      </div>
      <p className="font-medium text-slate-800">Não foi possível carregar os dados</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{mensagem}</p>
      {onRetry && (
        <Button variante="secondary" className="mt-4" onClick={onRetry} icone="reset">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function LoadingBlock({ rotulo = 'Carregando...' }: { rotulo?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-14 text-slate-500">
      <Spinner />
      <span className="text-sm">{rotulo}</span>
    </div>
  );
}

export function Field({
  rotulo,
  erro,
  dica,
  children,
  className = ''
}: {
  rotulo: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{rotulo}</span>
      {children}
      {erro ? <span className="mt-1 block text-xs text-rose-600">{erro}</span> : dica ? <span className="mt-1 block text-xs text-slate-400">{dica}</span> : null}
    </label>
  );
}

const BASE_CAMPO =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0 disabled:bg-slate-50 disabled:text-slate-500';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean }>(function Input(
  { invalido, className = '', ...resto },
  ref
) {
  return (
    <input
      ref={ref}
      className={`${BASE_CAMPO} ${invalido ? 'border-rose-400 focus:outline-rose-500' : 'border-slate-300 focus:outline-brand-500'} ${className}`}
      {...resto}
    />
  );
});

export function Select({
  invalido,
  className = '',
  children,
  ...resto
}: SelectHTMLAttributes<HTMLSelectElement> & { invalido?: boolean }) {
  return (
    <select
      className={`${BASE_CAMPO} ${invalido ? 'border-rose-400 focus:outline-rose-500' : 'border-slate-300 focus:outline-brand-500'} ${className}`}
      {...resto}
    >
      {children}
    </select>
  );
}

export function SearchInput({
  valor,
  onChange,
  placeholder = 'Pesquisar por nome ou matrícula...'
}: {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label="Pesquisar"
      />
    </div>
  );
}
