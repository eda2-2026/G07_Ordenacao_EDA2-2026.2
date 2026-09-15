import { Router } from 'express';
import { sort } from '../algorithms';
import { fieldComparator } from '../algorithms/comparators';
import { Dados } from '../store/dados';
import { FREQUENCIA_MINIMA, NOTA_RECUPERACAO } from '../types';
import { agregarAlunos, AlunoRanking, filtrarNotas } from '../services/consultas';
import { calcularEstatisticas } from '../services/estatisticas';
import { paginar, textoDe } from '../services/listagem';
import {
  desempenhoResumo,
  distribuicaoNotas,
  rankingExtremos,
  relatorioPorCurso,
  relatorioPorDisciplina,
  situacaoAcademica
} from '../services/relatorios';
import { consultaDe, filtroDe } from './utils';

function motivoDe(aluno: AlunoRanking): string | null {
  const notaBaixa = aluno.media < NOTA_RECUPERACAO;
  const frequenciaBaixa = aluno.frequencia < FREQUENCIA_MINIMA;
  if (notaBaixa && frequenciaBaixa) return 'Média abaixo de 5,0 e frequência abaixo de 75%';
  if (notaBaixa) return 'Média abaixo de 5,0';
  if (frequenciaBaixa) return 'Frequência abaixo de 75%';
  return null;
}

export function analisesRouter(dados: Dados): Router {
  const router = Router();

  router.get('/dashboard', (_req, res) => {
    const notas = dados.notas.todos();
    res.json({
      resumo: desempenhoResumo(dados),
      distribuicao: distribuicaoNotas(notas),
      situacao: situacaoAcademica(notas),
      mediaPorDisciplina: relatorioPorDisciplina(dados).map((l) => ({
        codigo: l.codigo,
        nome: l.nome,
        media: l.media
      })),
      mediaPorCurso: relatorioPorCurso(dados).map((l) => ({ curso: l.curso, media: l.media }))
    });
  });

  router.get('/estatisticas', (req, res) => {
    const filtro = filtroDe(consultaDe(req));
    res.json(calcularEstatisticas(filtrarNotas(dados, filtro)));
  });

  router.get('/relatorios/desempenho', (_req, res) => {
    res.json(desempenhoResumo(dados));
  });

  router.get('/relatorios/disciplinas', (_req, res) => {
    res.json(relatorioPorDisciplina(dados));
  });

  router.get('/relatorios/cursos', (_req, res) => {
    res.json(relatorioPorCurso(dados));
  });

  router.get('/relatorios/ranking', (_req, res) => {
    res.json(rankingExtremos(dados, 10));
  });

  router.get('/alertas', (req, res) => {
    const consulta = consultaDe(req);
    const motivoFiltro = textoDe(consulta, 'motivo');
    const emAtencao = agregarAlunos(dados, filtroDe(consulta))
      .map((aluno) => ({ ...aluno, motivo: motivoDe(aluno) }))
      .filter((aluno) => aluno.motivo !== null);
    const resumo = {
      total: emAtencao.length,
      porMedia: emAtencao.filter((a) => a.media < NOTA_RECUPERACAO).length,
      porFrequencia: emAtencao.filter((a) => a.frequencia < FREQUENCIA_MINIMA).length,
      ambos: emAtencao.filter((a) => a.media < NOTA_RECUPERACAO && a.frequencia < FREQUENCIA_MINIMA).length
    };
    const filtrados = emAtencao.filter((aluno) => {
      if (motivoFiltro === 'media') return aluno.media < NOTA_RECUPERACAO;
      if (motivoFiltro === 'frequencia') return aluno.frequencia < FREQUENCIA_MINIMA;
      return true;
    });
    const ordenados = sort(filtrados, 'quick', fieldComparator('media', 'asc')).data;
    res.json({ ...paginar(ordenados, consulta, 20), resumo });
  });

  return router;
}
