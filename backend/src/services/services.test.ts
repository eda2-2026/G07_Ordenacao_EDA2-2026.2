import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ALGORITHM_IDS, isSorted } from '../algorithms';
import { Dados } from '../store/dados';
import { Aluno, Disciplina, Nota, Professor } from '../types';
import { determinarStatus, calcularMedia } from '../rules';
import { agregarAlunos } from './consultas';
import { calcularEstatisticas, calcularMediana } from './estatisticas';
import { relatorioPorCurso, relatorioPorDisciplina, rankingExtremos } from './relatorios';
import { compararBuscas } from './busca';
import { executarLaboratorio, montarConjunto } from './laboratorio';
import { buildComparator } from '../algorithms/comparators';

let dir: string;
let dados: Dados;

const professores: Professor[] = [
  { id: 1, nome: 'Professor Um', matricula: 'P1', email: 'p1@exemplo.com', especialidade: 'X', departamento: 'Computação', status: 'Ativo' },
  { id: 2, nome: 'Professor Dois', matricula: 'P2', email: 'p2@exemplo.com', especialidade: 'Y', departamento: 'Computação', status: 'Ativo' }
];

const disciplinas: Disciplina[] = [
  { id: 1, codigo: 'D1', nome: 'Disciplina Um', cargaHoraria: 60, periodo: 1, professorId: 1, status: 'Ativa' },
  { id: 2, codigo: 'D2', nome: 'Disciplina Dois', cargaHoraria: 60, periodo: 1, professorId: 2, status: 'Ativa' }
];

const alunos: Aluno[] = [
  { id: 1, nome: 'Aluno Um', matricula: 'M1', email: 'a1@exemplo.com', idade: 20, curso: 'Curso A', periodo: 1, status: 'Ativo' },
  { id: 2, nome: 'Aluno Dois', matricula: 'M2', email: 'a2@exemplo.com', idade: 21, curso: 'Curso A', periodo: 1, status: 'Ativo' },
  { id: 3, nome: 'Aluno Tres', matricula: 'M3', email: 'a3@exemplo.com', idade: 22, curso: 'Curso B', periodo: 1, status: 'Ativo' },
  { id: 4, nome: 'Aluno Quatro', matricula: 'M4', email: 'a4@exemplo.com', idade: 23, curso: 'Curso B', periodo: 1, status: 'Ativo' },
  { id: 5, nome: 'Aluno Cinco', matricula: 'M5', email: 'a5@exemplo.com', idade: 24, curso: 'Curso B', periodo: 1, status: 'Ativo' }
];

function nota(id: number, alunoId: number, disciplinaId: number, professorId: number, media: number, frequencia: number): Nota {
  return {
    id,
    alunoId,
    disciplinaId,
    professorId,
    nota1: media,
    nota2: media,
    nota3: media,
    media: calcularMedia(media, media, media),
    frequencia,
    status: determinarStatus(media, frequencia)
  };
}

const notas: Nota[] = [
  nota(1, 1, 1, 1, 9, 90),
  nota(2, 2, 1, 1, 6, 80),
  nota(3, 3, 1, 1, 3, 90),
  nota(4, 4, 2, 2, 8, 60),
  nota(5, 5, 2, 2, 7, 100)
];

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sra-services-'));
  fs.writeFileSync(path.join(dir, 'alunos.json'), JSON.stringify(alunos));
  fs.writeFileSync(path.join(dir, 'professores.json'), JSON.stringify(professores));
  fs.writeFileSync(path.join(dir, 'disciplinas.json'), JSON.stringify(disciplinas));
  fs.writeFileSync(path.join(dir, 'notas.json'), JSON.stringify(notas));
  fs.writeFileSync(path.join(dir, 'usuarios.json'), JSON.stringify([]));
  dados = new Dados(dir);
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('regras aplicadas ao fixture (valores calculados manualmente)', () => {
  it('situação de cada lançamento segue média e frequência', () => {
    expect(notas[0].status).toBe('Aprovado');
    expect(notas[1].status).toBe('Recuperação');
    expect(notas[2].status).toBe('Reprovado');
    expect(notas[3].status).toBe('Reprovado por Frequência');
    expect(notas[4].status).toBe('Aprovado');
  });
});

describe('agregarAlunos', () => {
  it('reproduz exatamente a única nota de cada aluno (média e frequência)', () => {
    const resumo = agregarAlunos(dados);
    expect(resumo).toHaveLength(5);
    const porId = new Map(resumo.map((a) => [a.id, a]));
    expect(porId.get(1)).toMatchObject({ media: 9, frequencia: 90, status: 'Aprovado' });
    expect(porId.get(4)).toMatchObject({ media: 8, frequencia: 60, status: 'Reprovado por Frequência' });
  });

  it('filtra por curso corretamente', () => {
    const cursoA = agregarAlunos(dados, { curso: 'Curso A' });
    expect(cursoA.map((a) => a.id)).toEqual([1, 2]);
    const cursoB = agregarAlunos(dados, { curso: 'Curso B' });
    expect(cursoB.map((a) => a.id)).toEqual([3, 4, 5]);
  });
});

describe('calcularEstatisticas / calcularMediana', () => {
  it('calcula maior, menor, média, mediana e as taxas esperadas para o fixture', () => {
    const estatisticas = calcularEstatisticas(notas);
    expect(estatisticas.total).toBe(5);
    expect(estatisticas.maiorNota).toBe(9);
    expect(estatisticas.menorNota).toBe(3);
    expect(estatisticas.media).toBeCloseTo(6.6, 5);
    expect(estatisticas.mediana).toBe(7);
    expect(estatisticas.frequenciaMedia).toBeCloseTo(84, 5);
    expect(estatisticas.aprovados).toBe(2);
    expect(estatisticas.recuperacao).toBe(1);
    expect(estatisticas.reprovadosNota).toBe(1);
    expect(estatisticas.reprovadosFrequencia).toBe(1);
    expect(estatisticas.reprovados).toBe(2);
    expect(estatisticas.taxaAprovacao).toBeCloseTo(40, 5);
    expect(estatisticas.taxaRecuperacao).toBeCloseTo(20, 5);
    expect(estatisticas.taxaReprovacao).toBeCloseTo(40, 5);
  });

  it('calcula a mediana para quantidade ímpar e par de valores', () => {
    expect(calcularMediana([3, 6, 7, 8, 9])).toBe(7);
    expect(calcularMediana([3, 6, 7, 8])).toBe(6.5);
    expect(calcularMediana([])).toBe(0);
    expect(calcularMediana([42])).toBe(42);
  });
});

describe('relatorioPorCurso / relatorioPorDisciplina', () => {
  it('ordena os cursos da maior para a menor média', () => {
    const linhas = relatorioPorCurso(dados);
    expect(linhas.map((l) => l.curso)).toEqual(['Curso A', 'Curso B']);
    expect(linhas[0].media).toBeCloseTo(7.5, 5);
    expect(linhas[0].taxaAprovacao).toBeCloseTo(50, 5);
    expect(linhas[1].media).toBeCloseTo(6, 5);
    expect(linhas[1].taxaReprovacao).toBeCloseTo(66.7, 1);
  });

  it('ordena as disciplinas da maior para a menor média', () => {
    const linhas = relatorioPorDisciplina(dados);
    expect(linhas.map((l) => l.codigo)).toEqual(['D2', 'D1']);
    expect(linhas[0].media).toBeCloseTo(7.5, 5);
    expect(linhas[1].media).toBeCloseTo(6, 5);
  });
});

describe('rankingExtremos', () => {
  it('devolve o top e o bottom corretos por média', () => {
    const { top, bottom } = rankingExtremos(dados, 3);
    expect(top.map((a) => a.id)).toEqual([1, 4, 5]);
    expect(bottom.map((a) => a.id)).toEqual([3, 2, 5]);
  });
});

describe('compararBuscas', () => {
  it('encontra uma matrícula existente com sequencial e binária concordando', () => {
    const resultado = compararBuscas(dados, 'M3');
    expect(resultado.encontrado).toBe(true);
    expect(resultado.aluno?.id).toBe(3);
    expect(resultado.sequencial.comparacoes).toBeGreaterThan(0);
    expect(resultado.binaria.comparacoes).toBeGreaterThan(0);
  });

  it('reporta corretamente uma matrícula inexistente', () => {
    const resultado = compararBuscas(dados, 'NAO-EXISTE');
    expect(resultado.encontrado).toBe(false);
    expect(resultado.aluno).toBeNull();
  });
});

describe('laboratório de ordenação sobre o fixture', () => {
  it('monta o cenário ordenado e o inverso corretamente', () => {
    const comparadorAsc = buildComparator<{ id: number; nome: string; matricula: string; media: number; frequencia: number }>('nota', 'asc');
    const ordenado = montarConjunto(dados, 5, 'ordenado', 'nota');
    const inverso = montarConjunto(dados, 5, 'inverso', 'nota');
    expect(isSorted(ordenado, comparadorAsc)).toBe(true);
    expect(ordenado.map((a) => a.media)).toEqual([3, 6, 7, 8, 9]);
    expect(inverso.map((a) => a.media)).toEqual([9, 8, 7, 6, 3]);
    for (let i = 0; i < ordenado.length; i++) {
      expect(inverso[inverso.length - 1 - i].media).toBe(ordenado[i].media);
    }
  });

  it('executa os cinco algoritmos com resultados equivalentes no fixture pequeno', () => {
    const resultado = executarLaboratorio(dados, 5, 'aleatorio', 'nota', ALGORITHM_IDS, 1);
    expect(resultado.tamanho).toBe(5);
    expect(resultado.resultados).toHaveLength(5);
    expect(resultado.equivalentes).toBe(true);
    for (const r of resultado.resultados) {
      expect(r.ordenado).toBe(true);
    }
    expect(resultado.amostra.map((a) => a.media)).toEqual([3, 6, 7, 8, 9]);
  });
});
