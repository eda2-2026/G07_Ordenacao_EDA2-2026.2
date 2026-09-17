import { ReactNode } from 'react';
import { Icon } from './Icon';
import { EmptyState, ErrorState } from './ui';
import { Ordenacao } from '../hooks/useListagem';
import { Pagina } from '../types';

export interface Coluna<T> {
  chave: string;
  titulo: string;
  render: (item: T, indice: number) => ReactNode;
  ordenavel?: boolean;
  alinhamento?: 'left' | 'right' | 'center';
  className?: string;
}

interface DataTableProps<T> {
  colunas: Coluna<T>[];
  itens: T[] | undefined;
  chaveDe: (item: T) => string | number;
  carregando?: boolean;
  erro?: string | null;
  onRetry?: () => void;
  ordenacao?: Ordenacao | null;
  onOrdenar?: (campo: string) => void;
  vazioTitulo?: string;
  vazioDescricao?: string;
  vazioAcao?: ReactNode;
  destacarLinha?: (item: T) => string | undefined;
}

const ALINHAMENTO = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function DataTable<T>({
  colunas,
  itens,
  chaveDe,
  carregando,
  erro,
  onRetry,
  ordenacao,
  onOrdenar,
  vazioTitulo = 'Nenhum registro encontrado',
  vazioDescricao = 'Ajuste os filtros ou a pesquisa para ver outros resultados.',
  vazioAcao,
  destacarLinha
}: DataTableProps<T>) {
  if (erro && !itens) return <ErrorState mensagem={erro} onRetry={onRetry} />;

  const primeiraCarga = carregando && !itens;
  const vazio = !carregando && itens !== undefined && itens.length === 0;

  return (
    <div className="relative">
      <div className="scroll-thin overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {colunas.map((coluna) => {
                const ativa = ordenacao?.campo === coluna.chave;
                const alinhamento = ALINHAMENTO[coluna.alinhamento ?? 'left'];
                return (
                  <th
                    key={coluna.chave}
                    scope="col"
                    aria-sort={ativa ? (ordenacao?.ordem === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${alinhamento} ${coluna.className ?? ''}`}
                  >
                    {coluna.ordenavel && onOrdenar ? (
                      <button
                        type="button"
                        onClick={() => onOrdenar(coluna.chave)}
                        className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-800 ${ativa ? 'text-brand-600' : ''}`}
                      >
                        {coluna.titulo}
                        {ativa && <Icon name={ordenacao?.ordem === 'asc' ? 'up' : 'down'} className="h-3 w-3" />}
                      </button>
                    ) : (
                      coluna.titulo
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {primeiraCarga &&
              Array.from({ length: 8 }, (_, linha) => (
                <tr key={linha}>
                  {colunas.map((coluna) => (
                    <td key={coluna.chave} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))}
            {itens?.map((item, indice) => (
              <tr key={chaveDe(item)} className={`transition hover:bg-slate-50/70 ${destacarLinha?.(item) ?? ''}`}>
                {colunas.map((coluna) => (
                  <td key={coluna.chave} className={`px-4 py-3 text-slate-700 ${ALINHAMENTO[coluna.alinhamento ?? 'left']} ${coluna.className ?? ''}`}>
                    {coluna.render(item, indice)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {vazio && <EmptyState titulo={vazioTitulo} descricao={vazioDescricao} acao={vazioAcao} />}
      {carregando && itens && (
        <div className="absolute inset-0 flex items-start justify-center bg-white/60 pt-16 backdrop-blur-[1px]">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow ring-1 ring-slate-200">Atualizando...</span>
        </div>
      )}
    </div>
  );
}

export function Paginacao<T>({ pagina, onMudar }: { pagina: Pagina<T> | null; onMudar: (pagina: number) => void }) {
  if (!pagina || pagina.total === 0) return null;
  const inicio = (pagina.pagina - 1) * pagina.limite + 1;
  const fim = Math.min(pagina.pagina * pagina.limite, pagina.total);

  const janela: Array<number | 'gap'> = [];
  const total = pagina.totalPaginas;
  const atual = pagina.pagina;
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - atual) <= 1) janela.push(p);
    else if (janela[janela.length - 1] !== 'gap') janela.push('gap');
  }

  const botao = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
      <p className="text-sm text-slate-500">
        Mostrando <strong className="font-medium text-slate-700">{inicio}</strong>–<strong className="font-medium text-slate-700">{fim}</strong> de{' '}
        <strong className="font-medium text-slate-700">{pagina.total.toLocaleString('pt-BR')}</strong>
      </p>
      <nav className="flex items-center gap-1" aria-label="Paginação">
        <button
          type="button"
          className={`${botao} text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent`}
          disabled={atual <= 1}
          onClick={() => onMudar(atual - 1)}
          aria-label="Página anterior"
        >
          <Icon name="left" className="h-4 w-4" />
        </button>
        {janela.map((item, indice) =>
          item === 'gap' ? (
            <span key={`gap-${indice}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onMudar(item)}
              aria-current={item === atual ? 'page' : undefined}
              className={`${botao} ${item === atual ? 'bg-brand-600 font-medium text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          className={`${botao} text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent`}
          disabled={atual >= total}
          onClick={() => onMudar(atual + 1)}
          aria-label="Próxima página"
        >
          <Icon name="right" className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
