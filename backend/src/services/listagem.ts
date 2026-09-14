import { Direction, fieldComparator } from '../algorithms/comparators';
import { orderBy } from '../algorithms';

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export type Consulta = Record<string, unknown>;

export function textoDe(consulta: Consulta, chave: string): string {
  const valor = consulta[chave];
  return typeof valor === 'string' ? valor.trim() : '';
}

export function inteiroDe(consulta: Consulta, chave: string): number | undefined {
  const valor = textoDe(consulta, chave);
  if (valor === '') return undefined;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : undefined;
}

export function paginar<T>(itens: readonly T[], consulta: Consulta, limitePadrao = 20): Pagina<T> {
  const limite = Math.min(Math.max(inteiroDe(consulta, 'limite') ?? limitePadrao, 1), 100);
  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const pagina = Math.min(Math.max(inteiroDe(consulta, 'pagina') ?? 1, 1), totalPaginas);
  const inicio = (pagina - 1) * limite;
  return { itens: itens.slice(inicio, inicio + limite), total, pagina, limite, totalPaginas };
}

export function ordenarPorCampo<T>(itens: readonly T[], consulta: Consulta, permitidos: readonly (keyof T)[]): T[] {
  const campo = textoDe(consulta, 'ordenarPor');
  if (!campo || !(permitidos as readonly string[]).includes(campo)) return itens.slice();
  const direcao: Direction = textoDe(consulta, 'ordem') === 'desc' ? 'desc' : 'asc';
  return orderBy(itens, fieldComparator<T>(campo as keyof T, direcao));
}
