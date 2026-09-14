import { Router } from 'express';
import { Dados } from '../store/dados';
import { Aluno, CURSOS, STATUS_ALUNO, StatusNota } from '../types';
import { ErroHttp } from '../erros';
import { Corpo, corpoDe, Validador } from '../validacao';
import { agregarAlunos, correspondeBusca, filtrarNotas } from '../services/consultas';
import { ordenarPorCampo, paginar } from '../services/listagem';
import { consultaDe, filtroDe, idDe } from './utils';

interface AlunoListado extends Aluno {
  media: number | null;
  frequencia: number | null;
  situacao: StatusNota | null;
}

function validarAluno(dados: Dados, corpo: Corpo, idAtual?: number): Omit<Aluno, 'id'> {
  const v = new Validador(corpo);
  const aluno = {
    nome: v.texto('nome', 'Nome', 3, 100),
    matricula: v.texto('matricula', 'Matrícula', 3, 20),
    email: v.email('email'),
    idade: v.inteiro('idade', 'Idade', 14, 100),
    curso: v.opcao('curso', 'Curso', CURSOS),
    periodo: v.inteiro('periodo', 'Período', 1, 10),
    status: v.opcao('status', 'Status', STATUS_ALUNO)
  };
  if (!v.erros.matricula) {
    const duplicado = dados.alunos.todos().some((a) => a.matricula === aluno.matricula && a.id !== idAtual);
    if (duplicado) v.erro('matricula', 'Já existe um aluno com esta matrícula');
  }
  v.validar();
  return aluno;
}

export function alunosRouter(dados: Dados): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const consulta = consultaDe(req);
    const filtro = filtroDe(consulta);
    const resumo = new Map(agregarAlunos(dados).map((a) => [a.id, a]));
    let permitidos: Set<number> | undefined;
    if (filtro.disciplinaId !== undefined || filtro.professorId !== undefined) {
      permitidos = new Set(
        filtrarNotas(dados, { disciplinaId: filtro.disciplinaId, professorId: filtro.professorId }).map((n) => n.alunoId)
      );
    }
    const filtrados: AlunoListado[] = [];
    for (const aluno of dados.alunos.todos()) {
      if (filtro.curso !== undefined && aluno.curso !== filtro.curso) continue;
      if (filtro.periodo !== undefined && aluno.periodo !== filtro.periodo) continue;
      if (filtro.statusAluno !== undefined && aluno.status !== filtro.statusAluno) continue;
      if (permitidos && !permitidos.has(aluno.id)) continue;
      if (!correspondeBusca(aluno, filtro.busca)) continue;
      const agregado = resumo.get(aluno.id);
      filtrados.push({
        ...aluno,
        media: agregado ? agregado.media : null,
        frequencia: agregado ? agregado.frequencia : null,
        situacao: agregado ? agregado.status : null
      });
    }
    const ordenados = ordenarPorCampo(filtrados, consulta, [
      'id', 'nome', 'matricula', 'idade', 'curso', 'periodo', 'status', 'media', 'frequencia'
    ]);
    res.json(paginar(ordenados, consulta, 20));
  });

  router.get('/:id', (req, res) => {
    const aluno = dados.alunos.buscar(idDe(req));
    if (!aluno) throw new ErroHttp(404, 'Aluno não encontrado');
    const notas = filtrarNotas(dados, { alunoId: aluno.id }).map((nota) => ({
      ...nota,
      disciplinaCodigo: dados.disciplinas.buscar(nota.disciplinaId)?.codigo ?? '-',
      disciplinaNome: dados.disciplinas.buscar(nota.disciplinaId)?.nome ?? 'Disciplina removida',
      professorNome: dados.professores.buscar(nota.professorId)?.nome ?? 'Professor removido'
    }));
    const resumo = agregarAlunos(dados, { alunoId: aluno.id })[0] ?? null;
    res.json({ aluno, resumo, notas });
  });

  router.post('/', (req, res) => {
    const criado = dados.alunos.criar(validarAluno(dados, corpoDe(req.body)));
    res.status(201).json(criado);
  });

  router.put('/:id', (req, res) => {
    const id = idDe(req);
    if (!dados.alunos.existe(id)) throw new ErroHttp(404, 'Aluno não encontrado');
    const atualizado = dados.alunos.atualizar(id, validarAluno(dados, corpoDe(req.body), id));
    res.json(atualizado);
  });

  router.delete('/:id', (req, res) => {
    const id = idDe(req);
    if (!dados.alunos.existe(id)) throw new ErroHttp(404, 'Aluno não encontrado');
    const notasRemovidas = dados.notas.removerVarios((n) => n.alunoId === id);
    dados.alunos.remover(id);
    res.json({ removido: true, notasRemovidas });
  });

  return router;
}
