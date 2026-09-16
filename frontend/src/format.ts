const decimal2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const decimal1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const inteiro = new Intl.NumberFormat('pt-BR');
const tempo = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

export const formatarNota = (valor: number | null | undefined): string =>
  valor === null || valor === undefined ? '—' : decimal2.format(valor);

export const formatarFrequencia = (valor: number | null | undefined): string =>
  valor === null || valor === undefined ? '—' : `${decimal1.format(valor)}%`;

export const formatarPercentual = (valor: number): string => `${decimal1.format(valor)}%`;

export const formatarInteiro = (valor: number): string => inteiro.format(valor);

export const formatarTempo = (valor: number): string => `${tempo.format(valor)} ms`;

export function baixarCsv(nomeArquivo: string, cabecalhos: string[], linhas: Array<Array<string | number>>): void {
  const escapar = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`;
  const conteudo = [cabecalhos, ...linhas].map((linha) => linha.map(escapar).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
