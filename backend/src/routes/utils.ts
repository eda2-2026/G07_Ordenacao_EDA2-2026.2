import { Request } from 'express';
import { ErroHttp } from '../erros';
import { Consulta, inteiroDe, textoDe } from '../services/listagem';
import { FiltroAlunos } from '../services/consultas';

export function idDe(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new ErroHttp(400, 'Identificador inválido');
  return id;
}

export function consultaDe(req: Request): Consulta {
  return req.query as Consulta;
}

export function filtroDe(consulta: Consulta): FiltroAlunos {
  return {
    curso: textoDe(consulta, 'curso') || undefined,
    periodo: inteiroDe(consulta, 'periodo'),
    statusAluno: textoDe(consulta, 'status') || undefined,
    disciplinaId: inteiroDe(consulta, 'disciplinaId'),
    professorId: inteiroDe(consulta, 'professorId'),
    busca: textoDe(consulta, 'busca') || undefined
  };
}
