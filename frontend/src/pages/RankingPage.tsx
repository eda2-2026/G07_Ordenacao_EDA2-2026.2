import { useMemo, useState } from 'react';
import { qs } from '../api/client';
import { DataTable, Paginacao } from '../components/DataTable';
import { MetricasResumo } from '../components/Metricas';
import { Badge, Card, PageHeader, SearchInput, Select } from '../components/ui';
import { formatarFrequencia, formatarNota } from '../format';
import { useDebounce } from '../hooks/useDebounce';
import { useFetch } from '../hooks/useFetch';
import { useOpcoes } from '../hooks/useOpcoes';
import { AlgorithmId, AlunoRanking, Criterio, InfoOrdenacao, Metricas, Pagina } from '../types';

type ItemRanking = AlunoRanking & { posicao: number };
type RespostaRanking = Pagina<ItemRanking> & { criterio: Criterio; ordem: 'asc' | 'desc'; algoritmo: AlgorithmId; metricas: Metricas };

const CRITERIOS: Array<{ valor: Criterio; rotulo: string }> = [
  { valor: 'nota', rotulo: 'Média' },
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'matricula', rotulo: 'Matrícula' },
  { valor: 'frequencia', rotulo: 'Frequência' }
];

const MEDALHAS: Record<number, string> = { 1: 'bg-amber-100 text-amber-700 ring-amber-300', 2: 'bg-slate-200 text-slate-700 ring-slate-300', 3: 'bg-orange-100 text-orange-700 ring-orange-300' };

export function RankingPage() {
  const opcoes = useOpcoes();
  const info = useFetch<InfoOrdenacao>('/api/ordenacao/info');
  const [criterio, setCriterio] = useState<Criterio>('nota');
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('desc');
  const [algoritmo, setAlgoritmo] = useState<AlgorithmId>('merge');
  const [filtros, setFiltros] = useState({ busca: '', curso: '', periodo: '', disciplinaId: '', professorId: '' });
  const [pagina, setPagina] = useState(1);
  const busca = useDebounce(filtros.busca);

  const url = useMemo(
    () => `/api/ranking${qs({ criterio, ordem, algoritmo, ...filtros, busca, pagina, limite: 25 })}`,
    [criterio, ordem, algoritmo, filtros, busca, pagina]
  );
  const ranking = useFetch<RespostaRanking>(url);

  const definirFiltro = (chave: keyof typeof filtros, valor: string) => {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
    setPagina(1);
  };

  const escolherCriterio = (valor: Criterio) => {
    setCriterio(valor);
    setOrdem(valor === 'nota' || valor === 'frequencia' ? 'desc' : 'asc');
    setPagina(1);
  };

  const dados = ranking.data;

  return (
    <div>
      <PageHeader titulo="Ranking de alunos" subtitulo="Classificação calculada com os algoritmos de ordenação implementados manualmente" />

      <Card semPadding>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Ordenar por</span>
            <Select value={criterio} onChange={(e) => escolherCriterio(e.target.value as Criterio)}>
              {CRITERIOS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </Select>
          </label>
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Ordem</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Ordem">
              {(['desc', 'asc'] as const).map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => {
                    setOrdem(valor);
                    setPagina(1);
                  }}
                  aria-pressed={ordem === valor}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${ordem === valor ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {valor === 'desc' ? 'Decrescente' : 'Crescente'}
                </button>
              ))}
            </div>
          </div>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Algoritmo de ordenação</span>
            <Select
              value={algoritmo}
              onChange={(e) => {
                setAlgoritmo(e.target.value as AlgorithmId);
                setPagina(1);
              }}
            >
              {(info.data?.algoritmos ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — melhor {a.best} · médio {a.average} · pior {a.worst}
                </option>
              ))}
              {!info.data && <option value="merge">Merge Sort</option>}
            </Select>
          </label>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <SearchInput valor={filtros.busca} onChange={(v) => definirFiltro('busca', v)} />
          </div>
          <Select aria-label="Curso" value={filtros.curso} onChange={(e) => definirFiltro('curso', e.target.value)}>
            <option value="">Todos os cursos</option>
            {opcoes?.cursos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select aria-label="Período" value={filtros.periodo} onChange={(e) => definirFiltro('periodo', e.target.value)}>
            <option value="">Todos os períodos</option>
            {opcoes?.periodos.map((p) => (
              <option key={p} value={p}>
                {p}º período
              </option>
            ))}
          </Select>
          <Select aria-label="Disciplina" value={filtros.disciplinaId} onChange={(e) => definirFiltro('disciplinaId', e.target.value)}>
            <option value="">Todas as disciplinas</option>
            {opcoes?.disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} · {d.nome}
              </option>
            ))}
          </Select>
          <Select aria-label="Professor" value={filtros.professorId} onChange={(e) => definirFiltro('professorId', e.target.value)}>
            <option value="">Todos os professores</option>
            {opcoes?.professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </div>

        {dados && (
          <div className="border-b border-brand-100 bg-brand-50 px-4 py-3">
            <p className="mb-2 text-xs font-medium text-brand-700">
              Ordenação executada sobre {dados.total.toLocaleString('pt-BR')} alunos
            </p>
            <MetricasResumo metricas={dados.metricas} />
          </div>
        )}

        <DataTable<ItemRanking>
          itens={dados?.itens}
          carregando={ranking.loading}
          erro={ranking.error}
          onRetry={ranking.reload}
          chaveDe={(a) => a.id}
          vazioTitulo="Nenhum aluno no ranking"
          colunas={[
            {
              chave: 'posicao',
              titulo: 'Posição',
              alinhamento: 'center',
              render: (a) => (
                <span
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                    a.posicao <= 3 && criterio === 'nota' && ordem === 'desc' ? `ring-1 ${MEDALHAS[a.posicao]}` : 'text-slate-600'
                  }`}
                >
                  {a.posicao}º
                </span>
              )
            },
            {
              chave: 'nome',
              titulo: 'Aluno',
              render: (a) => (
                <div>
                  <p className="font-medium text-slate-900">{a.nome}</p>
                  <p className="font-mono text-xs text-slate-400">{a.matricula}</p>
                </div>
              )
            },
            { chave: 'curso', titulo: 'Curso', render: (a) => a.curso },
            { chave: 'media', titulo: 'Média', alinhamento: 'right', render: (a) => <strong>{formatarNota(a.media)}</strong> },
            { chave: 'frequencia', titulo: 'Frequência', alinhamento: 'right', render: (a) => formatarFrequencia(a.frequencia) },
            { chave: 'status', titulo: 'Status', render: (a) => <Badge>{a.status}</Badge> }
          ]}
        />
        <Paginacao pagina={dados ?? null} onMudar={setPagina} />
      </Card>
    </div>
  );
}
