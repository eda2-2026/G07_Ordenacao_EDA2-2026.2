import { Router } from 'express';
import { Dados } from '../store/dados';
import { Disciplina, STATUS_DISCIPLINA } from '../types';
import { ErroHttp } from '../erros';
import { Corpo, corpoDe, Validador } from '../validacao';
import { normalizarTexto } from '../rules';
import { inteiroDe, ordenarPorCampo, paginar, textoDe } from '../services/listagem';
import { consultaDe, idDe } from './utils';

function validarDisciplina(dados: Dados, corpo: Corpo, idAtual?: number): Omit<Disciplina, 'id'> {
  const v = new Validador(corpo);
  const disciplina = {
    codigo: v.texto('codigo', 'Código', 3, 12).toUpperCase(),
    nome: v.texto('nome', 'Nome', 3, 100),
    cargaHoraria: v.inteiro('cargaHoraria', 'Carga horária', 15, 400),
    periodo: v.inteiro('periodo', 'Período', 1, 10),
    professorId: v.inteiro('professorId', 'Professor', 1, 1000000),
    status: v.opcao('status', 'Status', STATUS_DISCIPLINA)
  };
  if (!v.erros.codigo) {
    const duplicado = dados.disciplinas.todos().some((d) => d.codigo === disciplina.codigo && d.id !== idAtual);
    if (duplicado) v.erro('codigo', 'Já existe uma disciplina com este código');
  }
  if (!v.erros.professorId && !dados.professores.existe(disciplina.professorId)) {
    v.erro('professorId', 'Professor não encontrado');
  }
  v.validar();
  return disciplina;
}

export function disciplinasRouter(dados: Dados): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const consulta = consultaDe(req);
    const busca = normalizarTexto(textoDe(consulta, 'busca'));
    const periodo = inteiroDe(consulta, 'periodo');
    const status = textoDe(consulta, 'status');
    const professorId = inteiroDe(consulta, 'professorId');
    const filtradas = dados.disciplinas
      .todos()
      .filter((d) => {
        if (periodo !== undefined && d.periodo !== periodo) return false;
        if (status && d.status !== status) return false;
        if (professorId !== undefined && d.professorId !== professorId) return false;
        if (busca && !normalizarTexto(d.nome).includes(busca) && !d.codigo.toLowerCase().includes(busca)) return false;
        return true;
      })
      .map((d) => ({ ...d, professorNome: dados.professores.buscar(d.professorId)?.nome ?? 'Professor removido' }));
    const ordenadas = ordenarPorCampo(filtradas, consulta, [
      'id', 'codigo', 'nome', 'cargaHoraria', 'periodo', 'professorNome', 'status'
    ]);
    res.json(paginar(ordenadas, consulta, 20));
  });

  router.get('/:id', (req, res) => {
    const disciplina = dados.disciplinas.buscar(idDe(req));
    if (!disciplina) throw new ErroHttp(404, 'Disciplina não encontrada');
    const professor = dados.professores.buscar(disciplina.professorId) ?? null;
    const quantidadeNotas = dados.notas.todos().filter((n) => n.disciplinaId === disciplina.id).length;
    res.json({ disciplina, professor, quantidadeNotas });
  });

  router.post('/', (req, res) => {
    res.status(201).json(dados.disciplinas.criar(validarDisciplina(dados, corpoDe(req.body))));
  });

  router.put('/:id', (req, res) => {
    const id = idDe(req);
    if (!dados.disciplinas.existe(id)) throw new ErroHttp(404, 'Disciplina não encontrada');
    res.json(dados.disciplinas.atualizar(id, validarDisciplina(dados, corpoDe(req.body), id)));
  });

  router.delete('/:id', (req, res) => {
    const id = idDe(req);
    if (!dados.disciplinas.existe(id)) throw new ErroHttp(404, 'Disciplina não encontrada');
    const notasRemovidas = dados.notas.removerVarios((n) => n.disciplinaId === id);
    dados.disciplinas.remover(id);
    res.json({ removido: true, notasRemovidas });
  });

  return router;
}
