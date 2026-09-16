import { StatusNota } from './types';

export const FREQUENCIA_MINIMA = 75;

export function calcularMedia(nota1: number, nota2: number, nota3: number): number {
  return Math.round(((nota1 + nota2 + nota3) / 3 + Number.EPSILON) * 100) / 100;
}

export function determinarStatus(media: number, frequencia: number): StatusNota {
  if (frequencia < FREQUENCIA_MINIMA) return 'Reprovado por Frequência';
  if (media >= 7) return 'Aprovado';
  if (media >= 5) return 'Recuperação';
  return 'Reprovado';
}
