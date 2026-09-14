import { DATA_DIR } from '../config';
import { Aluno, Disciplina, Nota, Professor, Usuario } from '../types';
import { Repositorio } from './repositorio';

export class Dados {
  readonly alunos: Repositorio<Aluno>;
  readonly professores: Repositorio<Professor>;
  readonly disciplinas: Repositorio<Disciplina>;
  readonly notas: Repositorio<Nota>;
  readonly usuarios: Repositorio<Usuario>;

  constructor(dir: string = DATA_DIR) {
    this.alunos = new Repositorio<Aluno>(dir, 'alunos.json');
    this.professores = new Repositorio<Professor>(dir, 'professores.json');
    this.disciplinas = new Repositorio<Disciplina>(dir, 'disciplinas.json');
    this.notas = new Repositorio<Nota>(dir, 'notas.json');
    this.usuarios = new Repositorio<Usuario>(dir, 'usuarios.json');
  }
}
