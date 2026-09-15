import { orderBy } from '../algorithms';
import { buildComparator, fieldComparator } from '../algorithms/comparators';
import { Dados } from '../store/dados';
import { Nota } from '../types';
import { agregarAlunos, AlunoRanking } from './consultas';
import { calcularEstatisticas } from './estatisticas';

export interface LinhaDisciplina {
  disciplinaId: number;
  codigo: string;
  nome: string;
  professor: string;
  quantidade: number;
  media: number;
  aprovados: number;
  taxaAprovacao: number;
  reprovados: number;
  taxaReprovacao: number;
  frequenciaMedia: number;
}

export interface LinhaCurso {
  curso: string;
  alunos: number;
  registros: number;
  media: number;
  taxaAprovacao: number;
  taxaReprovacao: number;
}

function agrupar<K>(notas: readonly Nota[], chave: (nota: Nota) => K | undefined): Map<K, Nota[]> {
  const grupos = new Map<K, Nota[]>();
  for (const nota of notas) {
    const k = chave(nota);
    if (k === undefined) continue;
    const lista = grupos.get(k);
    if (lista) lista.push(nota);
    else grupos.set(k, [nota]);
  }
  return grupos;
}

export function relatorioPorDisciplina(dados: Dados): LinhaDisciplina[] {
  const grupos = agrupar(dados.notas.todos(), (n) => n.disciplinaId);
  const linhas: LinhaDisciplina[] = [];
  for (const disciplina of dados.disciplinas.todos()) {
    const estatisticas = calcularEstatisticas(grupos.get(disciplina.id) ?? []);
    linhas.push({
      disciplinaId: disciplina.id,
      codigo: disciplina.codigo,
      nome: disciplina.nome,
      professor: dados.professores.buscar(disciplina.professorId)?.nome ?? '-',
      quantidade: estatisticas.total,
      media: estatisticas.media,
      aprovados: estatisticas.aprovados,
      taxaAprovacao: estatisticas.taxaAprovacao,
      reprovados: estatisticas.reprovados,
      taxaReprovacao: estatisticas.taxaReprovacao,
      frequenciaMedia: estatisticas.frequenciaMedia
    });
  }
  return orderBy(linhas, fieldComparator<LinhaDisciplina>('media', 'desc'));
}

export function relatorioPorCurso(dados: Dados): LinhaCurso[] {
  const grupos = agrupar(dados.notas.todos(), (n) => dados.alunos.buscar(n.alunoId)?.curso);
  const linhas: LinhaCurso[] = [];
  for (const [curso, notas] of grupos) {
    const estatisticas = calcularEstatisticas(notas);
    linhas.push({
      curso,
      alunos: new Set(notas.map((n) => n.alunoId)).size,
      registros: estatisticas.total,
      media: estatisticas.media,
      taxaAprovacao: estatisticas.taxaAprovacao,
      taxaReprovacao: estatisticas.taxaReprovacao
    });
  }
  return orderBy(linhas, fieldComparator<LinhaCurso>('media', 'desc'));
}

export function distribuicaoNotas(notas: readonly Nota[]): Array<{ faixa: string; quantidade: number }> {
  const faixas = Array.from({ length: 10 }, (_, i) => ({ faixa: `${i}-${i + 1}`, quantidade: 0 }));
  for (const nota of notas) {
    const indice = Math.min(9, Math.floor(nota.media));
    faixas[indice].quantidade++;
  }
  return faixas;
}

export function situacaoAcademica(notas: readonly Nota[]): Array<{ situacao: string; quantidade: number }> {
  const estatisticas = calcularEstatisticas(notas);
  return [
    { situacao: 'Aprovado', quantidade: estatisticas.aprovados },
    { situacao: 'Recuperação', quantidade: estatisticas.recuperacao },
    { situacao: 'Reprovado', quantidade: estatisticas.reprovadosNota },
    { situacao: 'Reprovado por Frequência', quantidade: estatisticas.reprovadosFrequencia }
  ];
}

export function rankingExtremos(dados: Dados, tamanho = 10): { top: AlunoRanking[]; bottom: AlunoRanking[] } {
  const alunos = agregarAlunos(dados);
  const decrescente = orderBy(alunos, buildComparator<AlunoRanking>('nota', 'desc'));
  const crescente = orderBy(alunos, buildComparator<AlunoRanking>('nota', 'asc'));
  return { top: decrescente.slice(0, tamanho), bottom: crescente.slice(0, tamanho) };
}

export function desempenhoResumo(dados: Dados) {
  return {
    ...calcularEstatisticas(dados.notas.todos()),
    totalAlunos: dados.alunos.total(),
    totalProfessores: dados.professores.total(),
    totalDisciplinas: dados.disciplinas.total()
  };
}
