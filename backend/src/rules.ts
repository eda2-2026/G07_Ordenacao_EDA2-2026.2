import { FREQUENCIA_MINIMA, NOTA_APROVACAO, NOTA_RECUPERACAO, StatusNota } from './types';

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calcularMedia(nota1: number, nota2: number, nota3: number): number {
  return round((nota1 + nota2 + nota3) / 3, 2);
}

export function determinarStatus(media: number, frequencia: number): StatusNota {
  if (frequencia < FREQUENCIA_MINIMA) return 'Reprovado por Frequência';
  if (media >= NOTA_APROVACAO) return 'Aprovado';
  if (media >= NOTA_RECUPERACAO) return 'Recuperação';
  return 'Reprovado';
}

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
