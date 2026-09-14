import { Router } from 'express';
import { Dados } from '../store/dados';
import { DEPARTAMENTOS, Professor, STATUS_PROFESSOR } from '../types';
import { ErroHttp } from '../erros';
import { Corpo, corpoDe, Validador } from '../validacao';
import { normalizarTexto } from '../rules';
import { inteiroDe, ordenarPorCampo, paginar, textoDe } from '../services/listagem';
import { consultaDe, idDe } from './utils';

function validarProfessor(dados: Dados, corpo: Corpo, idAtual?: number): Omit<Professor, 'id'> {
  const v = new Validador(corpo);
  const professor = {
    nome: v.texto('nome', 'Nome', 3, 100),
    matricula: v.texto('matricula', 'Matrícula', 3, 20),
    email: v.email('email'),
    especialidade: v.texto('especialidade', 'Especialidade', 3, 100),
    departamento: v.opcao('departamento', 'Departamento', DEPARTAMENTOS),
    status: v.opcao('status', 'Status', STATUS_PROFESSOR)
  };
  if (!v.erros.matricula) {
    const duplicado = dados.professores.todos().some((p) => p.matricula === professor.matricula && p.id !== idAtual);
    if (duplicado) v.erro('matricula', 'Já existe um professor com esta matrícula');
  }
  v.validar();
  return professor;
}

export function professoresRouter(dados: Dados): Router {
  const router = Router();

  const disciplinasDe = (professorId: number) =>
    dados.disciplinas
      .todos()
      .filter((d) => d.professorId === professorId)
      .map((d) => ({ id: d.id, codigo: d.codigo, nome: d.nome }));

  router.get('/', (req, res) => {
    const consulta = consultaDe(req);
    const busca = normalizarTexto(textoDe(consulta, 'busca'));
    const departamento = textoDe(consulta, 'departamento');
    const status = textoDe(consulta, 'status');
    const disciplinaId = inteiroDe(consulta, 'disciplinaId');
    const filtrados = dados.professores
      .todos()
      .filter((p) => {
        if (departamento && p.departamento !== departamento) return false;
        if (status && p.status !== status) return false;
        if (disciplinaId !== undefined && dados.disciplinas.buscar(disciplinaId)?.professorId !== p.id) return false;
        if (busca && !normalizarTexto(p.nome).includes(busca) && !p.matricula.toLowerCase().includes(busca)) return false;
        return true;
      })
      .map((p) => ({ ...p, disciplinas: disciplinasDe(p.id) }));
    const ordenados = ordenarPorCampo(filtrados, consulta, [
      'id', 'nome', 'matricula', 'departamento', 'especialidade', 'status'
    ]);
    res.json(paginar(ordenados, consulta, 20));
  });

  router.get('/:id', (req, res) => {
    const professor = dados.professores.buscar(idDe(req));
    if (!professor) throw new ErroHttp(404, 'Professor não encontrado');
    const quantidadeNotas = dados.notas.todos().filter((n) => n.professorId === professor.id).length;
    res.json({ professor, disciplinas: disciplinasDe(professor.id), quantidadeNotas });
  });

  router.post('/', (req, res) => {
    const criado = dados.professores.criar(validarProfessor(dados, corpoDe(req.body)));
    res.status(201).json(criado);
  });

  router.put('/:id', (req, res) => {
    const id = idDe(req);
    if (!dados.professores.existe(id)) throw new ErroHttp(404, 'Professor não encontrado');
    res.json(dados.professores.atualizar(id, validarProfessor(dados, corpoDe(req.body), id)));
  });

  router.delete('/:id', (req, res) => {
    const id = idDe(req);
    if (!dados.professores.existe(id)) throw new ErroHttp(404, 'Professor não encontrado');
    const vinculadas = disciplinasDe(id).length;
    if (vinculadas > 0) {
      throw new ErroHttp(409, `Professor possui ${vinculadas} disciplina(s) vinculada(s). Reatribua ou exclua as disciplinas antes.`);
    }
    const lancamentos = dados.notas.todos().filter((n) => n.professorId === id).length;
    if (lancamentos > 0) {
      throw new ErroHttp(409, `Professor possui ${lancamentos} lançamento(s) de notas vinculado(s) e não pode ser excluído.`);
    }
    dados.professores.remover(id);
    res.json({ removido: true });
  });

  return router;
}
