import { Router } from 'express';
import { Dados } from '../store/dados';
import { AlgorithmId, ALGORITHMS, isAlgorithmId } from '../algorithms';
import { CRITERIA, Criterion, isCriterion } from '../algorithms/comparators';
import { ErroValidacao } from '../erros';
import { corpoDe } from '../validacao';
import {
  Cenario,
  CENARIOS,
  executarLaboratorio,
  isCenario,
  TAMANHOS,
  visualizarOrdenacao
} from '../services/laboratorio';
import { compararBuscas } from '../services/busca';
import { textoDe } from '../services/listagem';

type Erros = Record<string, string>;

function lerCenario(valor: unknown, erros: Erros): Cenario {
  if (valor === undefined) return 'aleatorio';
  if (isCenario(valor)) return valor;
  erros.cenario = 'Cenário inválido';
  return 'aleatorio';
}

function lerCriterio(valor: unknown, erros: Erros): Criterion {
  if (valor === undefined) return 'nota';
  if (isCriterion(valor)) return valor;
  erros.criterio = 'Critério inválido';
  return 'nota';
}

function lerInteiro(valor: unknown, minimo: number, maximo: number, campo: string, erros: Erros, padrao?: number): number {
  const numero = valor === undefined && padrao !== undefined ? padrao : Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    erros[campo] = `Valor inválido (use de ${minimo} a ${maximo})`;
    return minimo;
  }
  return numero;
}

function falharSeHouverErros(erros: Erros): void {
  if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);
}

export function ordenacaoRouter(dados: Dados): Router {
  const router = Router();

  router.get('/info', (_req, res) => {
    res.json({
      algoritmos: ALGORITHMS,
      tamanhos: TAMANHOS,
      cenarios: CENARIOS,
      criterios: CRITERIA,
      totalAlunos: dados.alunos.total()
    });
  });

  router.post('/executar', (req, res) => {
    const corpo = corpoDe(req.body);
    const erros: Erros = {};
    const tamanho = lerInteiro(corpo.tamanho, 2, 5000, 'tamanho', erros);
    const cenario = lerCenario(corpo.cenario, erros);
    const criterio = lerCriterio(corpo.criterio, erros);
    const repeticoes = lerInteiro(corpo.repeticoes, 1, 20, 'repeticoes', erros, 5);
    let algoritmos: AlgorithmId[] = ALGORITHMS.map((a) => a.id);
    if (Array.isArray(corpo.algoritmos)) {
      const escolhidos = corpo.algoritmos.filter(isAlgorithmId);
      if (escolhidos.length === 0) erros.algoritmos = 'Selecione ao menos um algoritmo';
      else algoritmos = escolhidos;
    }
    falharSeHouverErros(erros);
    res.json(executarLaboratorio(dados, tamanho, cenario, criterio, algoritmos, repeticoes));
  });

  router.post('/visualizar', (req, res) => {
    const corpo = corpoDe(req.body);
    const erros: Erros = {};
    const tamanho = lerInteiro(corpo.tamanho, 3, 30, 'tamanho', erros);
    const cenario = lerCenario(corpo.cenario, erros);
    const criterio = lerCriterio(corpo.criterio, erros);
    const algoritmo = isAlgorithmId(corpo.algoritmo) ? corpo.algoritmo : undefined;
    if (!algoritmo) erros.algoritmo = 'Algoritmo inválido';
    falharSeHouverErros(erros);
    res.json(visualizarOrdenacao(dados, tamanho, algoritmo as AlgorithmId, cenario, criterio));
  });

  router.get('/busca', (req, res) => {
    const matricula = textoDe(req.query as Record<string, unknown>, 'matricula');
    if (!matricula) throw new ErroValidacao({ matricula: 'Informe a matrícula' });
    res.json(compararBuscas(dados, matricula));
  });

  return router;
}
