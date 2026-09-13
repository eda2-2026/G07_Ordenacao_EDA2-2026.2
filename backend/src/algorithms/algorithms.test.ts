import { describe, expect, it } from 'vitest';
import { ALGORITHMS, AlgorithmId, isSorted, sort } from './index';
import { buildComparator, Rankable } from './comparators';

const numeric = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);

const CASES: Array<{ name: string; input: number[] }> = [
  { name: 'vetor vazio', input: [] },
  { name: 'um elemento', input: [1] },
  { name: 'dois elementos ordenados', input: [1, 2] },
  { name: 'dois elementos invertidos', input: [2, 1] },
  { name: 'elementos iguais', input: [1, 1, 1] },
  { name: 'ordem decrescente', input: [5, 4, 3, 2, 1] },
  { name: 'ordem crescente', input: [1, 2, 3, 4, 5] },
  { name: 'com repetidos', input: [3, 1, 2, 3, 1, 2, 3] },
  { name: 'com negativos', input: [0, -5, 7, -1, 3, -5] }
];

function reference(values: number[]): number[] {
  const result: number[] = [];
  for (const value of values) {
    let position = result.length;
    while (position > 0 && result[position - 1] > value) position--;
    result.splice(position, 0, value);
  }
  return result;
}

function pseudoRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function makeAlunos(count: number, seed: number): Rankable[] {
  const random = pseudoRandom(seed);
  const alunos: Rankable[] = [];
  for (let i = 1; i <= count; i++) {
    alunos.push({
      id: i,
      nome: `Aluno ${Math.floor(random() * 50)}`,
      matricula: String(202300000 + Math.floor(random() * 99999)),
      media: Math.round(random() * 100) / 10,
      frequencia: Math.round(random() * 1000) / 10
    });
  }
  return alunos;
}

describe.each(ALGORITHMS.map((a) => [a.id, a.name] as [AlgorithmId, string]))('%s (%s)', (id) => {
  it.each(CASES)('ordena $name', ({ input }) => {
    const result = sort(input, id, numeric);
    expect(result.data).toEqual(reference(input));
  });

  it('não altera o vetor original', () => {
    const input = [5, 4, 3, 2, 1];
    sort(input, id, numeric);
    expect(input).toEqual([5, 4, 3, 2, 1]);
  });

  it('registra métricas coerentes', () => {
    const result = sort([5, 4, 3, 2, 1], id, numeric);
    expect(result.metrics.comparisons).toBeGreaterThan(0);
    expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
    expect(result.metrics.movements).toBeGreaterThan(0);
    expect(result.metrics.algorithm).toBe(ALGORITHMS.find((a) => a.id === id)?.name);
  });

  it('não registra trocas nem movimentações em vetor vazio', () => {
    const result = sort([], id, numeric);
    expect(result.metrics.comparisons).toBe(0);
    expect(result.metrics.swaps).toBe(0);
    expect(result.metrics.movements).toBe(0);
  });

  it.each(['nome', 'matricula', 'nota', 'frequencia'] as const)('ordena objetos Aluno por %s', (criterion) => {
    const alunos = makeAlunos(300, 42);
    const comparator = buildComparator<Rankable>(criterion, 'asc');
    const result = sort(alunos, id, comparator);
    expect(result.data).toHaveLength(alunos.length);
    expect(isSorted(result.data, comparator)).toBe(true);
    expect(new Set(result.data.map((a) => a.id)).size).toBe(alunos.length);
  });

  it('ordena de forma decrescente', () => {
    const alunos = makeAlunos(200, 7);
    const comparator = buildComparator<Rankable>('nota', 'desc');
    const result = sort(alunos, id, comparator);
    expect(isSorted(result.data, comparator)).toBe(true);
    expect(result.data[0].media).toBeGreaterThanOrEqual(result.data[result.data.length - 1].media);
  });
});

describe('equivalência entre algoritmos', () => {
  it('todos produzem exatamente o mesmo resultado para objetos Aluno', () => {
    const alunos = makeAlunos(500, 2026);
    for (const criterion of ['nome', 'matricula', 'nota', 'frequencia'] as const) {
      const comparator = buildComparator<Rankable>(criterion, 'asc');
      const results = ALGORITHMS.map((a) => sort(alunos, a.id, comparator).data.map((x) => x.id));
      for (const result of results) {
        expect(result).toEqual(results[0]);
      }
    }
  });

  it('todos produzem o mesmo resultado para números aleatórios', () => {
    const random = pseudoRandom(99);
    const values = Array.from({ length: 400 }, () => Math.floor(random() * 100));
    const expected = reference(values);
    for (const algorithm of ALGORITHMS) {
      expect(sort(values, algorithm.id, numeric).data).toEqual(expected);
    }
  });

  it('mantém o vetor original intacto entre execuções sucessivas', () => {
    const alunos = makeAlunos(100, 5);
    const snapshot = alunos.map((a) => a.id);
    const comparator = buildComparator<Rankable>('nota', 'asc');
    for (const algorithm of ALGORITHMS) {
      sort(alunos, algorithm.id, comparator);
      expect(alunos.map((a) => a.id)).toEqual(snapshot);
    }
  });
});

describe('valores exatos de referência (golden values)', () => {
  const entrada = [3, 1, 2];
  const esperado: Record<AlgorithmId, { comparisons: number; swaps: number; movements: number }> = {
    bubble: { comparisons: 3, swaps: 2, movements: 4 },
    selection: { comparisons: 3, swaps: 2, movements: 4 },
    insertion: { comparisons: 3, swaps: 0, movements: 4 },
    merge: { comparisons: 3, swaps: 0, movements: 5 },
    quick: { comparisons: 2, swaps: 2, movements: 4 }
  };

  it.each(ALGORITHMS.map((a) => a.id))('produz as métricas exatas calculadas manualmente para [3,1,2] (%s)', (id) => {
    const resultado = sort(entrada, id, numeric);
    expect(resultado.data).toEqual([1, 2, 3]);
    expect(resultado.metrics.comparisons).toBe(esperado[id].comparisons);
    expect(resultado.metrics.swaps).toBe(esperado[id].swaps);
    expect(resultado.metrics.movements).toBe(esperado[id].movements);
  });
});

describe('invariantes das métricas', () => {
  const random = pseudoRandom(31415);
  const amostras = Array.from({ length: 15 }, () =>
    Array.from({ length: 1 + Math.floor(random() * 80) }, () => Math.floor(random() * 40) - 20)
  );

  it.each(['bubble', 'selection', 'quick'] as const)(
    'movimentações == 2 × trocas em %s (algoritmo só troca posições, nunca desloca)',
    (id) => {
      for (const amostra of amostras) {
        const { metrics } = sort(amostra, id, numeric);
        expect(metrics.movements).toBe(metrics.swaps * 2);
      }
    }
  );

  it.each(['insertion', 'merge'] as const)('nunca registra trocas em %s (algoritmo só desloca elementos)', (id) => {
    for (const amostra of amostras) {
      expect(sort(amostra, id, numeric).metrics.swaps).toBe(0);
    }
  });
});

describe('checagem em massa contra um oráculo independente (Array.prototype.sort)', () => {
  it('todos os algoritmos reproduzem exatamente o resultado de Array.prototype.sort em 5.000 números aleatórios com duplicados e negativos', () => {
    const random = pseudoRandom(271828);
    const valores = Array.from({ length: 5000 }, () => Math.floor(random() * 400) - 200);
    const oraculo = valores.slice().sort((a, b) => a - b);
    for (const algoritmo of ALGORITHMS) {
      const resultado = sort(valores, algoritmo.id, numeric).data;
      expect(resultado).toEqual(oraculo);
      expect(resultado).toHaveLength(valores.length);
    }
  });

  it('todos os algoritmos ordenam corretamente valores decimais', () => {
    const random = pseudoRandom(161803);
    const valores = Array.from({ length: 800 }, () => Math.round((random() * 20 - 10) * 100) / 100);
    const oraculo = valores.slice().sort((a, b) => a - b);
    for (const algoritmo of ALGORITHMS) {
      expect(sort(valores, algoritmo.id, numeric).data).toEqual(oraculo);
    }
  });
});

describe('comportamento nos cenários', () => {
  const size = 200;
  const ascending = Array.from({ length: size }, (_, i) => i);
  const descending = Array.from({ length: size }, (_, i) => size - 1 - i);

  it('Bubble e Insertion executam O(n) comparações em dados ordenados', () => {
    expect(sort(ascending, 'bubble', numeric).metrics.comparisons).toBe(size - 1);
    expect(sort(ascending, 'insertion', numeric).metrics.comparisons).toBe(size - 1);
  });

  it('Selection realiza sempre n(n-1)/2 comparações', () => {
    const expected = (size * (size - 1)) / 2;
    expect(sort(ascending, 'selection', numeric).metrics.comparisons).toBe(expected);
    expect(sort(descending, 'selection', numeric).metrics.comparisons).toBe(expected);
  });

  it('Bubble em ordem inversa realiza n(n-1)/2 trocas', () => {
    expect(sort(descending, 'bubble', numeric).metrics.swaps).toBe((size * (size - 1)) / 2);
  });

  it('Insertion em ordem inversa realiza n(n-1)/2 comparações e a mesma quantidade de movimentações de deslocamento', () => {
    const esperado = (size * (size - 1)) / 2;
    const resultado = sort(descending, 'insertion', numeric).metrics;
    expect(resultado.comparisons).toBe(esperado);
    expect(resultado.movements).toBe(esperado + (size - 1));
  });

  it('Merge Sort nunca ultrapassa n·ceil(log2 n) comparações, mesmo no pior caso', () => {
    const limite = size * Math.ceil(Math.log2(size));
    expect(sort(ascending, 'merge', numeric).metrics.comparisons).toBeLessThanOrEqual(limite);
    expect(sort(descending, 'merge', numeric).metrics.comparisons).toBeLessThanOrEqual(limite);
  });

  it('Quick Sort degenera para O(n²) em dados ordenados', () => {
    const quadratic = sort(ascending, 'quick', numeric).metrics.comparisons;
    const merge = sort(ascending, 'merge', numeric).metrics.comparisons;
    expect(quadratic).toBeGreaterThan(merge * 5);
  });

  it('Quick Sort suporta 2000 elementos já ordenados sem estourar a pilha', () => {
    const many = Array.from({ length: 2000 }, (_, i) => i);
    expect(isSorted(sort(many, 'quick', numeric).data, numeric)).toBe(true);
  });

  it('observador recebe os passos da execução', () => {
    const events: number[] = [];
    const result = sort([3, 1, 2], 'bubble', numeric, (event) => {
      events.push(event.comparisons);
    });
    expect(events.length).toBeGreaterThan(0);
    expect(result.data).toEqual([1, 2, 3]);
  });
});
