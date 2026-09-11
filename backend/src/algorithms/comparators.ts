import { Comparator } from './context';

export type Criterion = 'nome' | 'matricula' | 'nota' | 'frequencia';
export type Direction = 'asc' | 'desc';

export const CRITERIA: Criterion[] = ['nome', 'matricula', 'nota', 'frequencia'];

export interface Rankable {
  id: number;
  nome: string;
  matricula: string;
  media: number;
  frequencia: number;
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

export function isCriterion(value: unknown): value is Criterion {
  return typeof value === 'string' && (CRITERIA as string[]).includes(value);
}

function compareNumbers(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function buildComparator<T extends Rankable>(
  criterion: Criterion,
  direction: Direction = 'asc'
): Comparator<T> {
  const factor = direction === 'asc' ? 1 : -1;
  return (a, b) => {
    let result: number;
    switch (criterion) {
      case 'nome':
        result = collator.compare(a.nome, b.nome);
        break;
      case 'matricula':
        result = compareText(a.matricula, b.matricula);
        break;
      case 'nota':
        result = compareNumbers(a.media, b.media);
        break;
      case 'frequencia':
        result = compareNumbers(a.frequencia, b.frequencia);
        break;
    }
    if (result !== 0) return result * factor;
    return compareNumbers(a.id, b.id);
  };
}

export function fieldComparator<T>(field: keyof T, direction: Direction = 'asc'): Comparator<T> {
  const factor = direction === 'asc' ? 1 : -1;
  return (a, b) => {
    const x = a[field] as unknown;
    const y = b[field] as unknown;
    if (x === y) return 0;
    if (x === undefined || x === null) return 1;
    if (y === undefined || y === null) return -1;
    if (typeof x === 'number' && typeof y === 'number') return compareNumbers(x, y) * factor;
    return collator.compare(String(x), String(y)) * factor;
  };
}
