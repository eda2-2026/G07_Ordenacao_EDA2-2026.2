import express, { Express, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { FRONTEND_DIST } from './config';
import { ErroHttp, ErroValidacao } from './erros';
import { Dados } from './store/dados';
import { alunosRouter } from './routes/alunos';
import { analisesRouter } from './routes/analises';
import { authRouter } from './routes/auth';
import { disciplinasRouter } from './routes/disciplinas';
import { notasRouter } from './routes/notas';
import { ordenacaoRouter } from './routes/ordenacao';
import { professoresRouter } from './routes/professores';
import { rankingRouter } from './routes/ranking';

export function criarApp(dados: Dados = new Dados()): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/saude', (_req, res) => {
    res.json({ status: 'ok', alunos: dados.alunos.total(), notas: dados.notas.total() });
  });

  app.use('/api', authRouter(dados));
  app.use('/api', analisesRouter(dados));
  app.use('/api/alunos', alunosRouter(dados));
  app.use('/api/professores', professoresRouter(dados));
  app.use('/api/disciplinas', disciplinasRouter(dados));
  app.use('/api/notas', notasRouter(dados));
  app.use('/api/ranking', rankingRouter(dados));
  app.use('/api/ordenacao', ordenacaoRouter(dados));

  app.use('/api', (_req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
  });

  if (fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
    app.use(express.static(FRONTEND_DIST));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
  }

  app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (erro instanceof ErroValidacao) {
      res.status(400).json({ erro: erro.message, campos: erro.campos });
      return;
    }
    if (erro instanceof ErroHttp) {
      res.status(erro.status).json({ erro: erro.message });
      return;
    }
    if (erro instanceof SyntaxError) {
      res.status(400).json({ erro: 'Corpo da requisição inválido' });
      return;
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  });

  return app;
}
