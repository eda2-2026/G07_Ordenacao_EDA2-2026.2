import fs from 'fs';
import os from 'os';
import path from 'path';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from './app';
import { Dados } from './store/dados';
import { DATA_DIR } from './config';
import { calcularMedia, determinarStatus } from './rules';

let servidor: Server;
let base: string;
let dir: string;

async function chamar(metodo: string, rota: string, corpo?: unknown) {
  const resposta = await fetch(`${base}${rota}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo)
  });
  const json = (await resposta.json()) as any;
  return { status: resposta.status, json };
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sra-'));
  for (const arquivo of fs.readdirSync(DATA_DIR)) {
    fs.copyFileSync(path.join(DATA_DIR, arquivo), path.join(dir, arquivo));
  }
  const app = criarApp(new Dados(dir));
  await new Promise<void>((resolve) => {
    servidor = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => servidor.close(() => resolve()));
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('regras acadêmicas', () => {
  it('calcula a média aritmética das três notas', () => {
    expect(calcularMedia(7, 8, 6)).toBe(7);
    expect(calcularMedia(10, 5, 5)).toBe(6.67);
  });

  it('classifica a situação pela média e pela frequência', () => {
    expect(determinarStatus(7, 80)).toBe('Aprovado');
    expect(determinarStatus(6.99, 80)).toBe('Recuperação');
    expect(determinarStatus(5, 80)).toBe('Recuperação');
    expect(determinarStatus(4.99, 80)).toBe('Reprovado');
    expect(determinarStatus(9, 74.9)).toBe('Reprovado por Frequência');
    expect(determinarStatus(9, 75)).toBe('Aprovado');
  });
});

describe('dados de demonstração', () => {
  it('possui a quantidade esperada de registros', async () => {
    const { json } = await chamar('GET', '/api/saude');
    expect(json.alunos).toBe(2000);
    expect(json.notas).toBeGreaterThan(5000);
    const professores = await chamar('GET', '/api/professores?limite=100');
    expect(professores.json.total).toBe(50);
    const disciplinas = await chamar('GET', '/api/disciplinas?limite=100');
    expect(disciplinas.json.total).toBe(30);
  });

  it('possui matrículas únicas', async () => {
    const dadosAlunos = JSON.parse(fs.readFileSync(path.join(dir, 'alunos.json'), 'utf-8')) as Array<{ matricula: string }>;
    expect(new Set(dadosAlunos.map((a) => a.matricula)).size).toBe(dadosAlunos.length);
  });
});

describe('login demonstrativo', () => {
  it('autentica usuários fictícios', async () => {
    const ok = await chamar('POST', '/api/login', { usuario: 'admin', senha: 'admin123' });
    expect(ok.status).toBe(200);
    expect(ok.json.senha).toBeUndefined();
    const erro = await chamar('POST', '/api/login', { usuario: 'admin', senha: 'errada' });
    expect(erro.status).toBe(401);
  });
});

describe('listagens, busca, filtros e paginação', () => {
  it('pagina alunos com 20 registros por padrão', async () => {
    const { json } = await chamar('GET', '/api/alunos');
    expect(json.itens).toHaveLength(20);
    expect(json.total).toBe(2000);
    expect(json.totalPaginas).toBe(100);
  });

  it('pesquisa por nome ignorando acentos e por matrícula', async () => {
    const primeiro = (await chamar('GET', '/api/alunos?limite=1')).json.itens[0];
    const porMatricula = await chamar('GET', `/api/alunos?busca=${primeiro.matricula}`);
    expect(porMatricula.json.itens.some((a: { id: number }) => a.id === primeiro.id)).toBe(true);
    const porNome = await chamar('GET', `/api/alunos?busca=${encodeURIComponent(primeiro.nome.toUpperCase())}`);
    expect(porNome.json.itens.some((a: { id: number }) => a.id === primeiro.id)).toBe(true);
  });

  it('filtra por curso, período e status', async () => {
    const { json } = await chamar('GET', `/api/alunos?curso=${encodeURIComponent('Física')}&periodo=3&status=Ativo&limite=100`);
    expect(json.total).toBeGreaterThan(0);
    for (const aluno of json.itens) {
      expect(aluno.curso).toBe('Física');
      expect(aluno.periodo).toBe(3);
      expect(aluno.status).toBe('Ativo');
    }
  });

  it('filtra alunos por disciplina e professor', async () => {
    const disciplina = (await chamar('GET', '/api/disciplinas?limite=1')).json.itens[0];
    const { json } = await chamar('GET', `/api/alunos?disciplinaId=${disciplina.id}&limite=100`);
    expect(json.total).toBeGreaterThan(0);
    const porProfessor = await chamar('GET', `/api/alunos?professorId=${disciplina.professorId}&limite=100`);
    expect(porProfessor.json.total).toBeGreaterThanOrEqual(json.total);
  });

  it('ordena a listagem pelas colunas usando os algoritmos próprios', async () => {
    const { json } = await chamar('GET', '/api/alunos?ordenarPor=nome&ordem=asc&limite=100');
    const nomes = json.itens.map((a: { nome: string }) => a.nome);
    for (let i = 1; i < nomes.length; i++) {
      expect(nomes[i - 1].localeCompare(nomes[i], 'pt-BR', { sensitivity: 'base' })).toBeLessThanOrEqual(0);
    }
  });
});

describe('CRUD de alunos', () => {
  it('valida os campos obrigatórios', async () => {
    const { status, json } = await chamar('POST', '/api/alunos', { nome: 'A' });
    expect(status).toBe(400);
    expect(json.campos.nome).toBeDefined();
    expect(json.campos.email).toBeDefined();
  });

  it('cria, edita, consulta e exclui', async () => {
    const novo = {
      nome: 'Aluno de Teste',
      matricula: 'TESTE-001',
      email: 'teste@exemplo.com',
      idade: 20,
      curso: 'Matemática',
      periodo: 2,
      status: 'Ativo'
    };
    const criado = await chamar('POST', '/api/alunos', novo);
    expect(criado.status).toBe(201);
    const id = criado.json.id;

    const duplicado = await chamar('POST', '/api/alunos', novo);
    expect(duplicado.status).toBe(400);
    expect(duplicado.json.campos.matricula).toBeDefined();

    const editado = await chamar('PUT', `/api/alunos/${id}`, { ...novo, nome: 'Aluno Editado' });
    expect(editado.status).toBe(200);
    expect(editado.json.nome).toBe('Aluno Editado');

    const detalhe = await chamar('GET', `/api/alunos/${id}`);
    expect(detalhe.json.aluno.nome).toBe('Aluno Editado');

    const removido = await chamar('DELETE', `/api/alunos/${id}`);
    expect(removido.status).toBe(200);
    expect((await chamar('GET', `/api/alunos/${id}`)).status).toBe(404);
  });

  it('persiste as alterações no arquivo JSON', async () => {
    const criado = await chamar('POST', '/api/alunos', {
      nome: 'Persistencia Teste',
      matricula: 'PERSIST-01',
      email: 'persist@exemplo.com',
      idade: 30,
      curso: 'Física',
      periodo: 5,
      status: 'Ativo'
    });
    const arquivo = JSON.parse(fs.readFileSync(path.join(dir, 'alunos.json'), 'utf-8')) as Array<{ id: number }>;
    expect(arquivo.some((a) => a.id === criado.json.id)).toBe(true);
    await chamar('DELETE', `/api/alunos/${criado.json.id}`);
  });
});

describe('CRUD de professores e disciplinas', () => {
  it('cria professor, disciplina e impede excluir professor vinculado', async () => {
    const professor = await chamar('POST', '/api/professores', {
      nome: 'Professor Teste',
      matricula: 'P99999',
      email: 'prof@exemplo.com',
      especialidade: 'Algoritmos',
      departamento: 'Computação',
      status: 'Ativo'
    });
    expect(professor.status).toBe(201);

    const disciplina = await chamar('POST', '/api/disciplinas', {
      codigo: 'tst101',
      nome: 'Disciplina de Teste',
      cargaHoraria: 60,
      periodo: 1,
      professorId: professor.json.id,
      status: 'Ativa'
    });
    expect(disciplina.status).toBe(201);
    expect(disciplina.json.codigo).toBe('TST101');

    const bloqueado = await chamar('DELETE', `/api/professores/${professor.json.id}`);
    expect(bloqueado.status).toBe(409);

    const editada = await chamar('PUT', `/api/disciplinas/${disciplina.json.id}`, { ...disciplina.json, nome: 'Outro Nome' });
    expect(editada.json.nome).toBe('Outro Nome');

    expect((await chamar('DELETE', `/api/disciplinas/${disciplina.json.id}`)).status).toBe(200);
    expect((await chamar('DELETE', `/api/professores/${professor.json.id}`)).status).toBe(200);
  });

  it('rejeita disciplina com professor inexistente', async () => {
    const { status, json } = await chamar('POST', '/api/disciplinas', {
      codigo: 'XXX999',
      nome: 'Sem Professor',
      cargaHoraria: 60,
      periodo: 1,
      professorId: 99999,
      status: 'Ativa'
    });
    expect(status).toBe(400);
    expect(json.campos.professorId).toBeDefined();
  });
});

describe('CRUD de notas', () => {
  it('calcula média e situação no lançamento e na edição', async () => {
    const aluno = await chamar('POST', '/api/alunos', {
      nome: 'Aluno Notas',
      matricula: 'NOTAS-01',
      email: 'notas@exemplo.com',
      idade: 21,
      curso: 'Administração',
      periodo: 1,
      status: 'Ativo'
    });
    const disciplina = (await chamar('GET', '/api/disciplinas?limite=1')).json.itens[0];
    const corpo = {
      alunoId: aluno.json.id,
      disciplinaId: disciplina.id,
      professorId: disciplina.professorId,
      nota1: 8,
      nota2: 7,
      nota3: 6,
      frequencia: 90
    };
    const criada = await chamar('POST', '/api/notas', corpo);
    expect(criada.status).toBe(201);
    expect(criada.json.media).toBe(7);
    expect(criada.json.status).toBe('Aprovado');

    const duplicada = await chamar('POST', '/api/notas', corpo);
    expect(duplicada.status).toBe(400);

    const emRecuperacao = await chamar('PUT', `/api/notas/${criada.json.id}`, { ...corpo, nota3: 3 });
    expect(emRecuperacao.json.media).toBe(6);
    expect(emRecuperacao.json.status).toBe('Recuperação');

    const porFrequencia = await chamar('PUT', `/api/notas/${criada.json.id}`, { ...corpo, frequencia: 60 });
    expect(porFrequencia.json.status).toBe('Reprovado por Frequência');

    const invalida = await chamar('PUT', `/api/notas/${criada.json.id}`, { ...corpo, nota1: 11 });
    expect(invalida.status).toBe(400);

    await chamar('DELETE', `/api/alunos/${aluno.json.id}`);
    expect((await chamar('GET', `/api/notas/${criada.json.id}`)).status).toBe(404);
  });
});

describe('ranking', () => {
  it('ordena por média decrescente com qualquer algoritmo e resultados equivalentes', async () => {
    const ids: number[][] = [];
    for (const algoritmo of ['bubble', 'selection', 'insertion', 'merge', 'quick']) {
      const { json } = await chamar('GET', `/api/ranking?criterio=nota&ordem=desc&algoritmo=${algoritmo}&limite=25`);
      expect(json.itens[0].posicao).toBe(1);
      expect(json.metricas.comparisons).toBeGreaterThan(0);
      for (let i = 1; i < json.itens.length; i++) {
        expect(json.itens[i - 1].media).toBeGreaterThanOrEqual(json.itens[i].media);
      }
      ids.push(json.itens.map((a: { id: number }) => a.id));
    }
    for (const lista of ids) expect(lista).toEqual(ids[0]);
  });

  it('suporta todos os critérios e ambas as direções', async () => {
    for (const criterio of ['nota', 'nome', 'matricula', 'frequencia']) {
      for (const ordem of ['asc', 'desc']) {
        const { status, json } = await chamar('GET', `/api/ranking?criterio=${criterio}&ordem=${ordem}`);
        expect(status).toBe(200);
        expect(json.total).toBeGreaterThan(1000);
      }
    }
  });

  it('rejeita parâmetros inválidos', async () => {
    expect((await chamar('GET', '/api/ranking?criterio=xyz')).status).toBe(400);
  });
});

describe('laboratório de ordenação', () => {
  it('executa os cinco algoritmos sobre cópias equivalentes em todos os cenários', async () => {
    for (const cenario of ['aleatorio', 'ordenado', 'inverso']) {
      const { status, json } = await chamar('POST', '/api/ordenacao/executar', {
        tamanho: 100,
        cenario,
        criterio: 'nota',
        repeticoes: 1
      });
      expect(status).toBe(200);
      expect(json.tamanho).toBe(100);
      expect(json.resultados).toHaveLength(5);
      expect(json.equivalentes).toBe(true);
      for (const resultado of json.resultados) {
        expect(resultado.ordenado).toBe(true);
        expect(resultado.comparisons).toBeGreaterThan(0);
        expect(resultado.executionTime).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('bubble e insertion são lineares em dados ordenados e quadráticos em dados invertidos', async () => {
    const ordenado = await chamar('POST', '/api/ordenacao/executar', { tamanho: 500, cenario: 'ordenado', criterio: 'matricula', repeticoes: 1 });
    const inverso = await chamar('POST', '/api/ordenacao/executar', { tamanho: 500, cenario: 'inverso', criterio: 'matricula', repeticoes: 1 });
    const achar = (json: { resultados: Array<{ id: string; comparisons: number }> }, id: string) =>
      json.resultados.find((r) => r.id === id)!.comparisons;
    expect(achar(ordenado.json, 'bubble')).toBe(499);
    expect(achar(ordenado.json, 'insertion')).toBe(499);
    expect(achar(inverso.json, 'bubble')).toBeGreaterThan(100000);
    expect(achar(inverso.json, 'insertion')).toBeGreaterThan(100000);
  });

  it('gera quadros de visualização para conjuntos pequenos', async () => {
    const { status, json } = await chamar('POST', '/api/ordenacao/visualizar', {
      tamanho: 10,
      algoritmo: 'quick',
      cenario: 'aleatorio',
      criterio: 'nota'
    });
    expect(status).toBe(200);
    expect(json.itens).toHaveLength(10);
    expect(json.quadros.length).toBeGreaterThan(2);
    expect(json.quadros[json.quadros.length - 1].tipo).toBe('fim');
    expect(json.metricas.algorithm).toBe('Quick Sort');
  });

  it('valida parâmetros', async () => {
    expect((await chamar('POST', '/api/ordenacao/executar', { tamanho: 'x' })).status).toBe(400);
    expect((await chamar('POST', '/api/ordenacao/visualizar', { tamanho: 500, algoritmo: 'quick' })).status).toBe(400);
  });

  it('compara busca sequencial e binária', async () => {
    const aluno = (await chamar('GET', '/api/alunos?limite=1&pagina=1000')).json.itens[0];
    const { json } = await chamar('GET', `/api/ordenacao/busca?matricula=${aluno.matricula}`);
    expect(json.encontrado).toBe(true);
    expect(json.binaria.comparacoes).toBeLessThan(json.sequencial.comparacoes);
  });
});

describe('estatísticas, dashboard, relatórios e alertas', () => {
  it('calcula estatísticas com mediana', async () => {
    const { json } = await chamar('GET', '/api/estatisticas');
    expect(json.maiorNota).toBeGreaterThanOrEqual(json.mediana);
    expect(json.menorNota).toBeLessThanOrEqual(json.mediana);
    expect(json.aprovados + json.recuperacao + json.reprovados).toBe(json.total);
    expect(json.taxaAprovacao + json.taxaRecuperacao + json.taxaReprovacao).toBeGreaterThan(99.8);
  });

  it('entrega o dashboard completo', async () => {
    const { json } = await chamar('GET', '/api/dashboard');
    expect(json.resumo.totalAlunos).toBe(2000);
    expect(json.distribuicao).toHaveLength(10);
    expect(json.situacao).toHaveLength(4);
    expect(json.mediaPorDisciplina).toHaveLength(30);
    expect(json.mediaPorCurso).toHaveLength(8);
  });

  it('entrega relatórios por disciplina, curso e ranking', async () => {
    const disciplinas = await chamar('GET', '/api/relatorios/disciplinas');
    expect(disciplinas.json).toHaveLength(30);
    const cursos = await chamar('GET', '/api/relatorios/cursos');
    expect(cursos.json).toHaveLength(8);
    const ranking = await chamar('GET', '/api/relatorios/ranking');
    expect(ranking.json.top).toHaveLength(10);
    expect(ranking.json.bottom).toHaveLength(10);
    expect(ranking.json.top[0].media).toBeGreaterThanOrEqual(ranking.json.bottom[0].media);
  });

  it('lista alunos que precisam de atenção com o motivo', async () => {
    const { json } = await chamar('GET', '/api/alertas?limite=100');
    expect(json.total).toBeGreaterThan(0);
    for (const aluno of json.itens) {
      expect(aluno.media < 5 || aluno.frequencia < 75).toBe(true);
      expect(aluno.motivo).toBeTruthy();
    }
  });
});
