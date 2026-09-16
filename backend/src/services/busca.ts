import { orderBy } from '../algorithms';
import { Dados } from '../store/dados';
import { Aluno } from '../types';

export interface ResultadoBusca {
  matricula: string;
  encontrado: boolean;
  aluno: Aluno | null;
  total: number;
  sequencial: { comparacoes: number; tempo: number };
  binaria: { comparacoes: number; tempo: number; tempoOrdenacao: number };
}

const arredondar = (valor: number): number => Math.round(valor * 1000) / 1000;

export function compararBuscas(dados: Dados, matricula: string): ResultadoBusca {
  const alunos = dados.alunos.todos();

  const inicioSequencial = performance.now();
  let comparacoesSequencial = 0;
  let encontradoSequencial: Aluno | null = null;
  for (const aluno of alunos) {
    comparacoesSequencial++;
    if (aluno.matricula === matricula) {
      encontradoSequencial = aluno;
      break;
    }
  }
  const tempoSequencial = performance.now() - inicioSequencial;

  const inicioOrdenacao = performance.now();
  const ordenados = orderBy(alunos, (a, b) => (a.matricula < b.matricula ? -1 : a.matricula > b.matricula ? 1 : 0));
  const tempoOrdenacao = performance.now() - inicioOrdenacao;

  const inicioBinaria = performance.now();
  let comparacoesBinaria = 0;
  let baixo = 0;
  let alto = ordenados.length - 1;
  let encontradoBinaria: Aluno | null = null;
  while (baixo <= alto) {
    const meio = Math.floor((baixo + alto) / 2);
    comparacoesBinaria++;
    const atual = ordenados[meio].matricula;
    if (atual === matricula) {
      encontradoBinaria = ordenados[meio];
      break;
    }
    if (atual < matricula) baixo = meio + 1;
    else alto = meio - 1;
  }
  const tempoBinaria = performance.now() - inicioBinaria;

  return {
    matricula,
    encontrado: encontradoBinaria !== null,
    aluno: encontradoBinaria ?? encontradoSequencial,
    total: alunos.length,
    sequencial: { comparacoes: comparacoesSequencial, tempo: arredondar(tempoSequencial) },
    binaria: {
      comparacoes: comparacoesBinaria,
      tempo: arredondar(tempoBinaria),
      tempoOrdenacao: arredondar(tempoOrdenacao)
    }
  };
}
