import {
  AlgorithmId,
  ALGORITHM_IDS,
  getAlgorithmInfo,
  isSorted,
  orderBy,
  sort,
  SortMetrics
} from '../algorithms';
import { buildComparator, Criterion } from '../algorithms/comparators';
import { Dados } from '../store/dados';
import { AlunoRanking, agregarAlunos } from './consultas';

export type Cenario = 'aleatorio' | 'ordenado' | 'inverso';

export const CENARIOS: Cenario[] = ['aleatorio', 'ordenado', 'inverso'];
export const TAMANHOS = [100, 500, 1000, 2000];

export function isCenario(valor: unknown): valor is Cenario {
  return typeof valor === 'string' && (CENARIOS as string[]).includes(valor);
}

function criarAleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function embaralhar<T>(itens: readonly T[], aleatorio: () => number): T[] {
  const copia = itens.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    const temp = copia[i];
    copia[i] = copia[j];
    copia[j] = temp;
  }
  return copia;
}

export function montarConjunto(
  dados: Dados,
  tamanho: number,
  cenario: Cenario,
  criterio: Criterion,
  semente: number = Math.floor(Math.random() * 1e9)
): AlunoRanking[] {
  const todos = agregarAlunos(dados);
  const amostra = embaralhar(todos, criarAleatorio(semente)).slice(0, tamanho);
  if (cenario === 'aleatorio') return amostra;
  if (cenario === 'ordenado') return orderBy(amostra, buildComparator<AlunoRanking>(criterio, 'asc'));
  return orderBy(amostra, buildComparator<AlunoRanking>(criterio, 'desc'));
}

export interface ResultadoAlgoritmo extends SortMetrics {
  id: AlgorithmId;
  ordenado: boolean;
  repeticoes: number;
}

export interface ResultadoExecucao {
  tamanho: number;
  cenario: Cenario;
  criterio: Criterion;
  repeticoes: number;
  resultados: ResultadoAlgoritmo[];
  equivalentes: boolean;
  amostra: Array<{ posicao: number; nome: string; matricula: string; media: number; frequencia: number }>;
}

export function executarLaboratorio(
  dados: Dados,
  tamanho: number,
  cenario: Cenario,
  criterio: Criterion,
  algoritmos: AlgorithmId[] = ALGORITHM_IDS,
  repeticoes = 5
): ResultadoExecucao {
  const original = montarConjunto(dados, tamanho, cenario, criterio);
  const comparador = buildComparator<AlunoRanking>(criterio, 'asc');
  const resultados: ResultadoAlgoritmo[] = [];
  const ordens: string[] = [];
  let primeiraOrdenacao: AlunoRanking[] = [];

  for (const algoritmo of algoritmos) {
    const tempos: number[] = [];
    let ultimo = sort(original, algoritmo, comparador);
    for (let i = 0; i < repeticoes; i++) {
      ultimo = sort(original, algoritmo, comparador);
      tempos.push(ultimo.metrics.executionTime);
    }
    const ordenados = sort(tempos, 'insertion', (a, b) => (a < b ? -1 : a > b ? 1 : 0)).data;
    const mediana = ordenados[Math.floor(ordenados.length / 2)];
    resultados.push({
      ...ultimo.metrics,
      executionTime: mediana,
      id: algoritmo,
      ordenado: isSorted(ultimo.data, comparador),
      repeticoes
    });
    ordens.push(ultimo.data.map((a) => a.id).join(','));
    if (primeiraOrdenacao.length === 0) primeiraOrdenacao = ultimo.data;
  }

  return {
    tamanho: original.length,
    cenario,
    criterio,
    repeticoes,
    resultados,
    equivalentes: ordens.every((ordem) => ordem === ordens[0]),
    amostra: primeiraOrdenacao.slice(0, 10).map((a, i) => ({
      posicao: i + 1,
      nome: a.nome,
      matricula: a.matricula,
      media: a.media,
      frequencia: a.frequencia
    }))
  };
}

export interface Quadro {
  tipo: 'inicio' | 'compare' | 'swap' | 'move' | 'fim';
  ordem: number[];
  destaques: number[];
  comparacoes: number;
  trocas: number;
  movimentacoes: number;
}

export interface ResultadoVisualizacao {
  algoritmo: string;
  criterio: Criterion;
  cenario: Cenario;
  tamanho: number;
  itens: Array<{ id: number; rotulo: string; valor: number; nome: string; matricula: string; media: number; frequencia: number }>;
  quadros: Quadro[];
  metricas: SortMetrics;
  resultado: Array<{ posicao: number; nome: string; matricula: string; media: number; frequencia: number }>;
}

export function visualizarOrdenacao(
  dados: Dados,
  tamanho: number,
  algoritmo: AlgorithmId,
  cenario: Cenario,
  criterio: Criterion
): ResultadoVisualizacao {
  const original = montarConjunto(dados, tamanho, cenario, criterio);
  const comparador = buildComparator<AlunoRanking>(criterio, 'asc');
  const referencia = orderBy(original, comparador);
  const posicaoFinal = new Map<number, number>();
  referencia.forEach((aluno, indice) => posicaoFinal.set(aluno.id, indice + 1));

  const valorDe = (aluno: AlunoRanking): number => {
    if (criterio === 'nota') return aluno.media;
    if (criterio === 'frequencia') return aluno.frequencia;
    return posicaoFinal.get(aluno.id) ?? 0;
  };
  const rotuloDe = (aluno: AlunoRanking): string => {
    if (criterio === 'nota') return aluno.media.toFixed(1);
    if (criterio === 'frequencia') return `${Math.round(aluno.frequencia)}%`;
    if (criterio === 'matricula') return aluno.matricula.slice(-4);
    return aluno.nome.split(' ')[0];
  };

  const quadros: Quadro[] = [
    {
      tipo: 'inicio',
      ordem: original.map((a) => a.id),
      destaques: [],
      comparacoes: 0,
      trocas: 0,
      movimentacoes: 0
    }
  ];
  const traced = sort(original, algoritmo, comparador, (evento) => {
    quadros.push({
      tipo: evento.kind,
      ordem: evento.state.map((a) => a.id),
      destaques: evento.highlights,
      comparacoes: evento.comparisons,
      trocas: evento.swaps,
      movimentacoes: evento.movements
    });
  });
  const limpo = sort(original, algoritmo, comparador);
  quadros.push({
    tipo: 'fim',
    ordem: traced.data.map((a) => a.id),
    destaques: [],
    comparacoes: limpo.metrics.comparisons,
    trocas: limpo.metrics.swaps,
    movimentacoes: limpo.metrics.movements
  });

  return {
    algoritmo: getAlgorithmInfo(algoritmo).name,
    criterio,
    cenario,
    tamanho: original.length,
    itens: original.map((a) => ({
      id: a.id,
      rotulo: rotuloDe(a),
      valor: valorDe(a),
      nome: a.nome,
      matricula: a.matricula,
      media: a.media,
      frequencia: a.frequencia
    })),
    quadros,
    metricas: limpo.metrics,
    resultado: limpo.data.map((a, i) => ({
      posicao: i + 1,
      nome: a.nome,
      matricula: a.matricula,
      media: a.media,
      frequencia: a.frequencia
    }))
  };
}
