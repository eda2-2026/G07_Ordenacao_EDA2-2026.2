import { Dados } from '../store/dados';
import { Aluno, Nota, StatusNota } from '../types';
import { determinarStatus, normalizarTexto, round } from '../rules';

export interface FiltroNotas {
  curso?: string;
  periodo?: number;
  disciplinaId?: number;
  professorId?: number;
  alunoId?: number;
}

export interface FiltroAlunos extends FiltroNotas {
  statusAluno?: string;
  busca?: string;
}

export interface AlunoRanking {
  id: number;
  nome: string;
  matricula: string;
  curso: string;
  periodo: number;
  statusAluno: string;
  media: number;
  frequencia: number;
  status: StatusNota;
  quantidadeNotas: number;
}

export function correspondeBusca(aluno: Pick<Aluno, 'nome' | 'matricula'>, busca?: string): boolean {
  if (!busca) return true;
  const termo = normalizarTexto(busca);
  return normalizarTexto(aluno.nome).includes(termo) || aluno.matricula.toLowerCase().includes(termo);
}

export function filtrarNotas(dados: Dados, filtro: FiltroNotas): Nota[] {
  const usaAluno = filtro.curso !== undefined || filtro.periodo !== undefined;
  return dados.notas.todos().filter((nota) => {
    if (filtro.disciplinaId !== undefined && nota.disciplinaId !== filtro.disciplinaId) return false;
    if (filtro.professorId !== undefined && nota.professorId !== filtro.professorId) return false;
    if (filtro.alunoId !== undefined && nota.alunoId !== filtro.alunoId) return false;
    if (usaAluno) {
      const aluno = dados.alunos.buscar(nota.alunoId);
      if (!aluno) return false;
      if (filtro.curso !== undefined && aluno.curso !== filtro.curso) return false;
      if (filtro.periodo !== undefined && aluno.periodo !== filtro.periodo) return false;
    }
    return true;
  });
}

export function agregarAlunos(dados: Dados, filtro: FiltroAlunos = {}): AlunoRanking[] {
  const acumulado = new Map<number, { media: number; frequencia: number; quantidade: number }>();
  const notas = filtrarNotas(dados, {
    disciplinaId: filtro.disciplinaId,
    professorId: filtro.professorId,
    alunoId: filtro.alunoId
  });
  for (const nota of notas) {
    const atual = acumulado.get(nota.alunoId) ?? { media: 0, frequencia: 0, quantidade: 0 };
    atual.media += nota.media;
    atual.frequencia += nota.frequencia;
    atual.quantidade++;
    acumulado.set(nota.alunoId, atual);
  }
  const resultado: AlunoRanking[] = [];
  for (const aluno of dados.alunos.todos()) {
    const soma = acumulado.get(aluno.id);
    if (!soma) continue;
    if (filtro.curso !== undefined && aluno.curso !== filtro.curso) continue;
    if (filtro.periodo !== undefined && aluno.periodo !== filtro.periodo) continue;
    if (filtro.statusAluno !== undefined && aluno.status !== filtro.statusAluno) continue;
    if (!correspondeBusca(aluno, filtro.busca)) continue;
    const media = round(soma.media / soma.quantidade, 2);
    const frequencia = round(soma.frequencia / soma.quantidade, 1);
    resultado.push({
      id: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      curso: aluno.curso,
      periodo: aluno.periodo,
      statusAluno: aluno.status,
      media,
      frequencia,
      status: determinarStatus(media, frequencia),
      quantidadeNotas: soma.quantidade
    });
  }
  return resultado;
}
