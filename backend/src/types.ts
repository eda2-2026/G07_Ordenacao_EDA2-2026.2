export const STATUS_ALUNO = ['Ativo', 'Trancado', 'Inativo'] as const;
export const STATUS_PROFESSOR = ['Ativo', 'Afastado', 'Inativo'] as const;
export const STATUS_DISCIPLINA = ['Ativa', 'Inativa'] as const;
export const STATUS_NOTA = ['Aprovado', 'Recuperação', 'Reprovado', 'Reprovado por Frequência'] as const;

export type StatusAluno = (typeof STATUS_ALUNO)[number];
export type StatusProfessor = (typeof STATUS_PROFESSOR)[number];
export type StatusDisciplina = (typeof STATUS_DISCIPLINA)[number];
export type StatusNota = (typeof STATUS_NOTA)[number];

export const CURSOS = [
  'Ciência da Computação',
  'Engenharia de Software',
  'Sistemas de Informação',
  'Engenharia Elétrica',
  'Engenharia Civil',
  'Matemática',
  'Física',
  'Administração'
] as const;

export const DEPARTAMENTOS = [
  'Computação',
  'Matemática e Estatística',
  'Ciências Exatas',
  'Engenharias',
  'Administração e Economia'
] as const;

export const PERIODOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  idade: number;
  curso: string;
  periodo: number;
  status: StatusAluno;
}

export interface Professor {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  especialidade: string;
  departamento: string;
  status: StatusProfessor;
}

export interface Disciplina {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
  periodo: number;
  professorId: number;
  status: StatusDisciplina;
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

export interface Usuario {
  id: number;
  usuario: string;
  senha: string;
  nome: string;
  perfil: 'admin' | 'professor' | 'coordenador';
}

export interface Entidade {
  id: number;
}

export const NOTA_APROVACAO = 7;
export const NOTA_RECUPERACAO = 5;
export const FREQUENCIA_MINIMA = 75;
