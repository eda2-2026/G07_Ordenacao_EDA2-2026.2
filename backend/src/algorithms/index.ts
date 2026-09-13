import { bubbleSort } from './bubbleSort';
import { selectionSort } from './selectionSort';
import { insertionSort } from './insertionSort';
import { mergeSort } from './mergeSort';
import { quickSort } from './quickSort';
import { Comparator, SortContext, StepObserver } from './context';

export type { Comparator, StepEvent, StepObserver, StepKind } from './context';

export type AlgorithmId = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';

export interface SortMetrics {
  algorithm: string;
  comparisons: number;
  swaps: number;
  movements: number;
  executionTime: number;
}

export interface SortResult<T> {
  data: T[];
  metrics: SortMetrics;
}

export interface AlgorithmInfo {
  id: AlgorithmId;
  name: string;
  best: string;
  average: string;
  worst: string;
  space: string;
  stable: boolean;
  description: string;
}

type SortFunction = <T>(data: T[], ctx: SortContext<T>) => T[];

const IMPLEMENTATIONS: Record<AlgorithmId, SortFunction> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort
};

export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    description:
      'Percorre o vetor comparando pares adjacentes e trocando os que estão fora de ordem. Encerra antecipadamente quando uma passada não realiza trocas.'
  },
  {
    id: 'selection',
    name: 'Selection Sort',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
    description:
      'Seleciona o menor elemento da parte não ordenada e o posiciona no início dela. Realiza poucas trocas, mas sempre o mesmo número de comparações.'
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    description:
      'Constrói a parte ordenada um elemento por vez, deslocando os maiores para a direita e inserindo o elemento na posição correta. Excelente para dados quase ordenados.'
  },
  {
    id: 'merge',
    name: 'Merge Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    description:
      'Divide o vetor ao meio recursivamente e intercala as metades já ordenadas. Desempenho previsível, ao custo de memória auxiliar.'
  },
  {
    id: 'quick',
    name: 'Quick Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: false,
    description:
      'Escolhe um pivô (o último elemento), particiona o vetor em menores e maiores e ordena cada parte recursivamente. O pior caso ocorre com dados já ordenados e pivô extremo.'
  }
];

export const ALGORITHM_IDS: AlgorithmId[] = ALGORITHMS.map((a) => a.id);

export function isAlgorithmId(value: unknown): value is AlgorithmId {
  return typeof value === 'string' && (ALGORITHM_IDS as string[]).includes(value);
}

export function getAlgorithmInfo(id: AlgorithmId): AlgorithmInfo {
  return ALGORITHMS.find((a) => a.id === id) as AlgorithmInfo;
}

export function sort<T>(
  data: readonly T[],
  algorithm: AlgorithmId,
  comparator: Comparator<T>,
  observer?: StepObserver<T>
): SortResult<T> {
  const copy = data.slice();
  const ctx = new SortContext<T>(comparator, copy, observer);
  const start = performance.now();
  const sorted = IMPLEMENTATIONS[algorithm](copy, ctx);
  const elapsed = performance.now() - start;
  return {
    data: sorted,
    metrics: {
      algorithm: getAlgorithmInfo(algorithm).name,
      comparisons: ctx.comparisons,
      swaps: ctx.swaps,
      movements: ctx.movements,
      executionTime: Math.round(elapsed * 1000) / 1000
    }
  };
}

export function orderBy<T>(data: readonly T[], comparator: Comparator<T>): T[] {
  return sort(data, 'merge', comparator).data;
}

export function isSorted<T>(data: readonly T[], comparator: Comparator<T>): boolean {
  for (let i = 1; i < data.length; i++) {
    if (comparator(data[i - 1], data[i]) > 0) return false;
  }
  return true;
}
