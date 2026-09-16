export type StatusNota = 'Aprovado' | 'Recuperação' | 'Reprovado' | 'Reprovado por Frequência';
export type AlgorithmId = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';
export type Criterio = 'nome' | 'matricula' | 'nota' | 'frequencia';
export type Cenario = 'aleatorio' | 'ordenado' | 'inverso';

export interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  idade: number;
  curso: string;
  periodo: number;
  status: string;
}

export interface AlunoListado extends Aluno {
  media: number | null;
  frequencia: number | null;
  situacao: StatusNota | null;
}

export interface DisciplinaResumo {
  id: number;
  codigo: string;
  nome: string;
}

export interface Professor {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  especialidade: string;
  departamento: string;
  status: string;
}

export interface ProfessorListado extends Professor {
  disciplinas: DisciplinaResumo[];
}

export interface Disciplina {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
  periodo: number;
  professorId: number;
  status: string;
}

export interface DisciplinaListada extends Disciplina {
  professorNome: string;
}

export interface Nota {
  id: number;
  alunoId: number;
  disciplinaId: number;
  professorId: number;
  nota1: number;
  nota2: number;
  nota3: number;
  media: number;
  frequencia: number;
  status: StatusNota;
}

export interface NotaListada extends Nota {
  alunoNome: string;
  alunoMatricula: string;
  alunoCurso: string;
  disciplinaCodigo: string;
  disciplinaNome: string;
  professorNome: string;
}

export interface NotaDoAluno extends Nota {
  disciplinaCodigo: string;
  disciplinaNome: string;
  professorNome: string;
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

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface Metricas {
  algorithm: string;
  comparisons: number;
  swaps: number;
  movements: number;
  executionTime: number;
}

export interface Opcoes {
  cursos: string[];
  departamentos: string[];
  periodos: number[];
  statusAluno: string[];
  statusProfessor: string[];
  statusDisciplina: string[];
  statusNota: StatusNota[];
  professores: Array<{ id: number; nome: string; departamento: string }>;
  disciplinas: Array<{ id: number; codigo: string; nome: string; professorId: number }>;
}

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

export interface Desempenho extends Estatisticas {
  totalAlunos: number;
  totalProfessores: number;
  totalDisciplinas: number;
}

export interface Dashboard {
  resumo: Desempenho;
  distribuicao: Array<{ faixa: string; quantidade: number }>;
  situacao: Array<{ situacao: string; quantidade: number }>;
  mediaPorDisciplina: Array<{ codigo: string; nome: string; media: number }>;
  mediaPorCurso: Array<{ curso: string; media: number }>;
}

export interface AlgoritmoInfo {
  id: AlgorithmId;
  name: string;
  best: string;
  average: string;
  worst: string;
  space: string;
  stable: boolean;
  description: string;
}

export interface InfoOrdenacao {
  algoritmos: AlgoritmoInfo[];
  tamanhos: number[];
  cenarios: Cenario[];
  criterios: Criterio[];
  totalAlunos: number;
}

export interface ResultadoAlgoritmo extends Metricas {
  id: AlgorithmId;
  ordenado: boolean;
  repeticoes: number;
}

export interface AmostraOrdenada {
  posicao: number;
  nome: string;
  matricula: string;
  media: number;
  frequencia: number;
}

export interface ResultadoExecucao {
  tamanho: number;
  cenario: Cenario;
  criterio: Criterio;
  repeticoes: number;
  resultados: ResultadoAlgoritmo[];
  equivalentes: boolean;
  amostra: AmostraOrdenada[];
}

export interface Quadro {
  tipo: 'inicio' | 'compare' | 'swap' | 'move' | 'fim';
  ordem: number[];
  destaques: number[];
  comparacoes: number;
  trocas: number;
  movimentacoes: number;
}

export interface ItemVisual {
  id: number;
  rotulo: string;
  valor: number;
  nome: string;
  matricula: string;
  media: number;
  frequencia: number;
}

export interface ResultadoVisualizacao {
  algoritmo: string;
  criterio: Criterio;
  cenario: Cenario;
  tamanho: number;
  itens: ItemVisual[];
  quadros: Quadro[];
  metricas: Metricas;
  resultado: AmostraOrdenada[];
}

export interface ResultadoBusca {
  matricula: string;
  encontrado: boolean;
  aluno: Aluno | null;
  total: number;
  sequencial: { comparacoes: number; tempo: number };
  binaria: { comparacoes: number; tempo: number; tempoOrdenacao: number };
}

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

export interface UsuarioLogado {
  id: number;
  usuario: string;
  nome: string;
  perfil: 'admin' | 'professor' | 'coordenador';
}
