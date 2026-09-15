import { orderBy } from '../algorithms';
import { Nota } from '../types';
import { round } from '../rules';

export interface Estatisticas {
  total: number;
  maiorNota: number;
  menorNota: number;
  media: number;
  mediana: number;
  aprovados: number;
  recuperacao: number;
  reprovados: number;
  reprovadosNota: number;
  reprovadosFrequencia: number;
  frequenciaMedia: number;
  taxaAprovacao: number;
  taxaRecuperacao: number;
  taxaReprovacao: number;
}

const numerico = (a: number, b: number): number => (a < b ? -1 : a > b ? 1 : 0);

function medianaDeOrdenados(ordenados: readonly number[]): number {
  if (ordenados.length === 0) return 0;
  const meio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 1) return ordenados[meio];
  return (ordenados[meio - 1] + ordenados[meio]) / 2;
}

export function calcularMediana(valores: readonly number[]): number {
  return medianaDeOrdenados(orderBy(valores, numerico));
}

export function percentual(parte: number, total: number): number {
  return total === 0 ? 0 : round((parte / total) * 100, 1);
}

export function calcularEstatisticas(notas: readonly Nota[]): Estatisticas {
  const total = notas.length;
  let aprovados = 0;
  let recuperacao = 0;
  let reprovadosNota = 0;
  let reprovadosFrequencia = 0;
  let somaMedia = 0;
  let somaFrequencia = 0;
  const medias: number[] = [];
  for (const nota of notas) {
    medias.push(nota.media);
    somaMedia += nota.media;
    somaFrequencia += nota.frequencia;
    if (nota.status === 'Aprovado') aprovados++;
    else if (nota.status === 'Recuperação') recuperacao++;
    else if (nota.status === 'Reprovado') reprovadosNota++;
    else reprovadosFrequencia++;
  }
  const ordenadas = orderBy(medias, numerico);
  const reprovados = reprovadosNota + reprovadosFrequencia;
  return {
    total,
    maiorNota: total ? ordenadas[total - 1] : 0,
    menorNota: total ? ordenadas[0] : 0,
    media: total ? round(somaMedia / total, 2) : 0,
    mediana: total ? round(medianaDeOrdenados(ordenadas), 2) : 0,
    aprovados,
    recuperacao,
    reprovados,
    reprovadosNota,
    reprovadosFrequencia,
    frequenciaMedia: total ? round(somaFrequencia / total, 1) : 0,
    taxaAprovacao: percentual(aprovados, total),
    taxaRecuperacao: percentual(recuperacao, total),
    taxaReprovacao: percentual(reprovados, total)
  };
}
