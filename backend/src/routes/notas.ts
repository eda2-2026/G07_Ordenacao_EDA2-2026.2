import { Router } from 'express';
import { Dados } from '../store/dados';
import { Nota, STATUS_NOTA } from '../types';
import { ErroHttp } from '../erros';
import { Corpo, corpoDe, Validador } from '../validacao';
import { calcularMedia, determinarStatus, round } from '../rules';
import { correspondeBusca } from '../services/consultas';
import { inteiroDe, ordenarPorCampo, paginar, textoDe } from '../services/listagem';
import { consultaDe, idDe } from './utils';

function validarNota(dados: Dados, corpo: Corpo, idAtual?: number): Omit<Nota, 'id'> {
  const v = new Validador(corpo);
  const alunoId = v.inteiro('alunoId', 'Aluno', 1, 1000000);
  const disciplinaId = v.inteiro('disciplinaId', 'Disciplina', 1, 1000000);
  const professorId = v.inteiro('professorId', 'Professor', 1, 1000000);
  const nota1 = round(v.decimal('nota1', 'Nota 1', 0, 10), 2);
  const nota2 = round(v.decimal('nota2', 'Nota 2', 0, 10), 2);
  const nota3 = round(v.decimal('nota3', 'Nota 3', 0, 10), 2);
  const frequencia = round(v.decimal('frequencia', 'Frequência', 0, 100), 1);
  if (!v.erros.alunoId && !dados.alunos.existe(alunoId)) v.erro('alunoId', 'Aluno não encontrado');
  if (!v.erros.disciplinaId && !dados.disciplinas.existe(disciplinaId)) v.erro('disciplinaId', 'Disciplina não encontrada');
  if (!v.erros.professorId && !dados.professores.existe(professorId)) v.erro('professorId', 'Professor não encontrado');
  if (!v.erros.alunoId && !v.erros.disciplinaId) {
    const duplicada = dados.notas.todos().some((n) => n.alunoId === alunoId && n.disciplinaId === disciplinaId && n.id !== idAtual);
    if (duplicada) v.erro('disciplinaId', 'Já existe lançamento deste aluno nesta disciplina');
  }
  v.validar();
  const media = calcularMedia(nota1, nota2, nota3);
  return {
    alunoId,
    disciplinaId,
    professorId,
    nota1,
    nota2,
    nota3,
    media,
    frequencia,
    status: determinarStatus(media, frequencia)
  };
}

export function notasRouter(dados: Dados): Router {
  const router = Router();

  const enriquecer = (nota: Nota) => {
    const aluno = dados.alunos.buscar(nota.alunoId);
    const disciplina = dados.disciplinas.buscar(nota.disciplinaId);
    const professor = dados.professores.buscar(nota.professorId);
    return {
      ...nota,
      alunoNome: aluno?.nome ?? 'Aluno removido',
      alunoMatricula: aluno?.matricula ?? '-',
      alunoCurso: aluno?.curso ?? '-',
      disciplinaCodigo: disciplina?.codigo ?? '-',
      disciplinaNome: disciplina?.nome ?? 'Disciplina removida',
      professorNome: professor?.nome ?? 'Professor removido'
    };
  };

  router.get('/', (req, res) => {
    const consulta = consultaDe(req);
    const busca = textoDe(consulta, 'busca');
    const curso = textoDe(consulta, 'curso');
    const status = textoDe(consulta, 'status');
    const periodo = inteiroDe(consulta, 'periodo');
    const disciplinaId = inteiroDe(consulta, 'disciplinaId');
    const professorId = inteiroDe(consulta, 'professorId');
    const alunoId = inteiroDe(consulta, 'alunoId');
    const filtradas = dados.notas
      .todos()
      .filter((n) => {
        if (disciplinaId !== undefined && n.disciplinaId !== disciplinaId) return false;
        if (professorId !== undefined && n.professorId !== professorId) return false;
        if (alunoId !== undefined && n.alunoId !== alunoId) return false;
        if (status && n.status !== status) return false;
        if (busca || curso || periodo !== undefined) {
          const aluno = dados.alunos.buscar(n.alunoId);
          if (!aluno) return false;
          if (curso && aluno.curso !== curso) return false;
          if (periodo !== undefined && aluno.periodo !== periodo) return false;
          if (!correspondeBusca(aluno, busca)) return false;
        }
        return true;
      })
      .map(enriquecer);
    const ordenadas = ordenarPorCampo(filtradas, consulta, [
      'id', 'alunoNome', 'alunoMatricula', 'disciplinaCodigo', 'professorNome', 'media', 'frequencia', 'status'
    ]);
    res.json(paginar(ordenadas, consulta, 20));
  });

  router.get('/status', (_req, res) => {
    res.json(STATUS_NOTA);
  });

  router.get('/:id', (req, res) => {
    const nota = dados.notas.buscar(idDe(req));
    if (!nota) throw new ErroHttp(404, 'Lançamento não encontrado');
    res.json(enriquecer(nota));
  });

  router.post('/', (req, res) => {
    const criada = dados.notas.criar(validarNota(dados, corpoDe(req.body)));
    res.status(201).json(enriquecer(criada));
  });

  router.put('/:id', (req, res) => {
    const id = idDe(req);
    if (!dados.notas.existe(id)) throw new ErroHttp(404, 'Lançamento não encontrado');
    const atualizada = dados.notas.atualizar(id, validarNota(dados, corpoDe(req.body), id));
    res.json(enriquecer(atualizada as Nota));
  });

  router.delete('/:id', (req, res) => {
    const id = idDe(req);
    if (!dados.notas.remover(id)) throw new ErroHttp(404, 'Lançamento não encontrado');
    res.json({ removido: true });
  });

  return router;
}
