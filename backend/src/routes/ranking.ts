import { Router } from 'express';
import { Dados } from '../store/dados';
import { AlgorithmId, isAlgorithmId, sort } from '../algorithms';
import { buildComparator, Criterion, Direction, isCriterion } from '../algorithms/comparators';
import { ErroValidacao } from '../erros';
import { agregarAlunos, AlunoRanking } from '../services/consultas';
import { paginar, textoDe } from '../services/listagem';
import { consultaDe, filtroDe } from './utils';

export function rankingRouter(dados: Dados): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const consulta = consultaDe(req);
    const erros: Record<string, string> = {};
    const criterioBruto = textoDe(consulta, 'criterio') || 'nota';
    const algoritmoBruto = textoDe(consulta, 'algoritmo') || 'merge';
    const ordemBruta = textoDe(consulta, 'ordem') || 'desc';
    const criterio: Criterion = isCriterion(criterioBruto) ? criterioBruto : 'nota';
    const algoritmo: AlgorithmId = isAlgorithmId(algoritmoBruto) ? algoritmoBruto : 'merge';
    const ordem: Direction = ordemBruta === 'asc' ? 'asc' : 'desc';
    if (!isCriterion(criterioBruto)) erros.criterio = 'Critério inválido';
    if (!isAlgorithmId(algoritmoBruto)) erros.algoritmo = 'Algoritmo inválido';
    if (ordemBruta !== 'asc' && ordemBruta !== 'desc') erros.ordem = 'Ordem inválida';
    if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);

    const situacao = textoDe(consulta, 'situacao');
    let alunos = agregarAlunos(dados, filtroDe(consulta));
    if (situacao) alunos = alunos.filter((a) => a.status === situacao);

    const resultado = sort(alunos, algoritmo, buildComparator<AlunoRanking>(criterio, ordem));
    const posicionados = resultado.data.map((aluno, indice) => ({ ...aluno, posicao: indice + 1 }));
    res.json({
      ...paginar(posicionados, consulta, 25),
      criterio,
      ordem,
      algoritmo,
      metricas: resultado.metrics
    });
  });

  return router;
}
