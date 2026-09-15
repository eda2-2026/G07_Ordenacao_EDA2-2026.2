import { Router } from 'express';
import { Dados } from '../store/dados';
import { ErroHttp } from '../erros';
import { corpoDe } from '../validacao';
import { CURSOS, DEPARTAMENTOS, PERIODOS, STATUS_ALUNO, STATUS_DISCIPLINA, STATUS_NOTA, STATUS_PROFESSOR } from '../types';

export function authRouter(dados: Dados): Router {
  const router = Router();

  router.post('/login', (req, res) => {
    const corpo = corpoDe(req.body);
    const usuario = typeof corpo.usuario === 'string' ? corpo.usuario.trim() : '';
    const senha = typeof corpo.senha === 'string' ? corpo.senha : '';
    const encontrado = dados.usuarios.todos().find((u) => u.usuario === usuario && u.senha === senha);
    if (!encontrado) throw new ErroHttp(401, 'Usuário ou senha inválidos');
    res.json({ id: encontrado.id, usuario: encontrado.usuario, nome: encontrado.nome, perfil: encontrado.perfil });
  });

  router.get('/opcoes', (_req, res) => {
    res.json({
      cursos: CURSOS,
      departamentos: DEPARTAMENTOS,
      periodos: PERIODOS,
      statusAluno: STATUS_ALUNO,
      statusProfessor: STATUS_PROFESSOR,
      statusDisciplina: STATUS_DISCIPLINA,
      statusNota: STATUS_NOTA,
      professores: dados.professores.todos().map((p) => ({ id: p.id, nome: p.nome, departamento: p.departamento })),
      disciplinas: dados.disciplinas.todos().map((d) => ({ id: d.id, codigo: d.codigo, nome: d.nome, professorId: d.professorId }))
    });
  });

  return router;
}
