import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, qs } from '../api/client';
import { TabelaComplexidade } from '../components/Complexidade';
import { GraficoCenarios, GraficoMetrica, MetricaGrafico, nomeCenario, ROTULOS_METRICA } from '../components/GraficosDesempenho';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, ErrorState, Field, Input, LoadingBlock, PageHeader, Select } from '../components/ui';
import { CORES_ALGORITMO } from '../chartTheme';
import { formatarFrequencia, formatarInteiro, formatarNota, formatarTempo } from '../format';
import { useFetch } from '../hooks/useFetch';
import { AlgorithmId, Cenario, Criterio, InfoOrdenacao, ResultadoBusca, ResultadoExecucao } from '../types';

const CRITERIOS: Array<{ valor: Criterio; rotulo: string }> = [
  { valor: 'nota', rotulo: 'Nota (média)' },
  { valor: 'frequencia', rotulo: 'Frequência' },
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'matricula', rotulo: 'Matrícula' }
];

const CENARIOS: Array<{ valor: Cenario; rotulo: string; descricao: string }> = [
  { valor: 'aleatorio', rotulo: 'Aleatório', descricao: 'Dados em ordem aleatória (caso médio).' },
  { valor: 'ordenado', rotulo: 'Ordenado', descricao: 'Dados já em ordem crescente (melhor caso para Bubble e Insertion).' },
  { valor: 'inverso', rotulo: 'Inversamente ordenado', descricao: 'Dados em ordem decrescente (pior caso para Bubble, Insertion e Quick).' }
];

const METRICAS: MetricaGrafico[] = ['executionTime', 'comparisons', 'swaps', 'movements'];

function BuscaMatricula() {
  const [matricula, setMatricula] = useState('');
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    if (!matricula.trim()) {
      setErro('Informe uma matrícula.');
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      setResultado(await api.get<ResultadoBusca>(`/api/ordenacao/busca${qs({ matricula: matricula.trim() })}`));
    } catch (falha) {
      setResultado(null);
      setErro(falha instanceof ApiError ? falha.message : 'Erro ao buscar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Card titulo="Busca por matrícula: sequencial × binária" subtitulo="A busca binária exige o vetor ordenado — por isso a ordenação (Merge Sort) é executada antes">
      <form onSubmit={buscar} className="flex flex-wrap items-end gap-3" noValidate>
        <Field rotulo="Matrícula" erro={erro ?? undefined} className="w-full max-w-xs">
          <Input value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="Ex.: 202510002" invalido={!!erro} />
        </Field>
        <Button type="submit" carregando={carregando} icone="search">
          Buscar
        </Button>
      </form>
      {resultado && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Busca sequencial (O(n))</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatarInteiro(resultado.sequencial.comparacoes)} comparações</p>
            <p className="text-sm text-slate-500">{formatarTempo(resultado.sequencial.tempo)}</p>
          </div>
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Busca binária (O(log n))</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatarInteiro(resultado.binaria.comparacoes)} comparações</p>
            <p className="text-sm text-slate-500">
              {formatarTempo(resultado.binaria.tempo)} · ordenação prévia {formatarTempo(resultado.binaria.tempoOrdenacao)}
            </p>
          </div>
          <div className="md:col-span-2">
            {resultado.encontrado && resultado.aluno ? (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Encontrado: <strong>{resultado.aluno.nome}</strong> — {resultado.aluno.curso}, {resultado.aluno.periodo}º período (entre {formatarInteiro(resultado.total)} alunos).
              </p>
            ) : (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Matrícula não encontrada entre {formatarInteiro(resultado.total)} alunos (a busca sequencial percorreu todos; a binária descartou metades do vetor).
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export function OrdenacaoPage() {
  const toast = useToast();
  const info = useFetch<InfoOrdenacao>('/api/ordenacao/info');
  const [tamanho, setTamanho] = useState(500);
  const [cenario, setCenario] = useState<Cenario>('aleatorio');
  const [criterio, setCriterio] = useState<Criterio>('nota');
  const [selecionados, setSelecionados] = useState<AlgorithmId[]>(['bubble', 'selection', 'insertion', 'merge', 'quick']);
  const [executando, setExecutando] = useState<'unico' | 'todos' | null>(null);
  const [resultado, setResultado] = useState<ResultadoExecucao | null>(null);
  const [comparacao, setComparacao] = useState<Record<Cenario, ResultadoExecucao> | null>(null);
  const [logaritmica, setLogaritmica] = useState(true);
  const [metricaCenarios, setMetricaCenarios] = useState<MetricaGrafico>('comparisons');

  if (info.loading && !info.data) return <LoadingBlock />;
  if (info.error || !info.data) return <ErrorState mensagem={info.error ?? 'Sem dados'} onRetry={info.reload} />;
  const algoritmos = info.data.algoritmos;

  const alternarAlgoritmo = (id: AlgorithmId) => {
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((a) => a !== id) : [...atual, id]));
  };

  const executar = async (cenarioAlvo: Cenario) =>
    api.post<ResultadoExecucao>('/api/ordenacao/executar', { tamanho, cenario: cenarioAlvo, criterio, algoritmos: selecionados });

  const executarUnico = async () => {
    if (selecionados.length === 0) {
      toast.error('Selecione ao menos um algoritmo.');
      return;
    }
    setExecutando('unico');
    try {
      setResultado(await executar(cenario));
      toast.success('Ordenação concluída.');
    } catch (falha) {
      toast.error(falha instanceof ApiError ? falha.message : 'Erro ao executar a ordenação.');
    } finally {
      setExecutando(null);
    }
  };

  const compararCenarios = async () => {
    if (selecionados.length === 0) {
      toast.error('Selecione ao menos um algoritmo.');
      return;
    }
    setExecutando('todos');
    try {
      const aleatorio = await executar('aleatorio');
      const ordenado = await executar('ordenado');
      const inverso = await executar('inverso');
      setComparacao({ aleatorio, ordenado, inverso });
      toast.success('Comparação entre cenários concluída.');
    } catch (falha) {
      toast.error(falha instanceof ApiError ? falha.message : 'Erro ao comparar os cenários.');
    } finally {
      setExecutando(null);
    }
  };

  const melhorTempo = resultado ? Math.min(...resultado.resultados.map((r) => r.executionTime)) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Laboratório de Algoritmos de Ordenação"
        subtitulo="Compare Bubble, Selection, Insertion, Merge e Quick Sort sobre cópias idênticas dos mesmos dados"
        acoes={
          <Link to="/apresentacao" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Icon name="monitor" className="h-4 w-4" />
            Modo apresentação
          </Link>
        }
      />

      <Card titulo="Configuração do experimento" subtitulo={`Os dados são sorteados entre os ${formatarInteiro(info.data.totalAlunos)} alunos cadastrados`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Quantidade de elementos</p>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Quantidade de elementos">
              {info.data.tamanhos.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={tamanho === t}
                  onClick={() => setTamanho(t)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    tamanho === t ? 'border-brand-600 bg-brand-600 text-white shadow' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-500'
                  }`}
                >
                  {formatarInteiro(t)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Critério de ordenação</p>
            <Select value={criterio} onChange={(e) => setCriterio(e.target.value as Criterio)} aria-label="Critério">
              {CRITERIOS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">Cenário</p>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Cenário">
              {CENARIOS.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  role="radio"
                  aria-checked={cenario === c.valor}
                  onClick={() => setCenario(c.valor)}
                  className={`rounded-xl border p-3 text-left transition ${
                    cenario === c.valor ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-slate-200 bg-white hover:border-brand-500'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{c.rotulo}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{c.descricao}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">Algoritmos</p>
            <div className="flex flex-wrap gap-2">
              {algoritmos.map((a) => {
                const ativo = selecionados.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      ativo ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <input type="checkbox" checked={ativo} onChange={() => alternarAlgoritmo(a.id)} className="sr-only" />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES_ALGORITMO[a.id] }} />
                    {a.name}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button onClick={executarUnico} carregando={executando === 'unico'} disabled={executando !== null} icone="play">
            Executar ordenação
          </Button>
          <Button variante="secondary" onClick={compararCenarios} carregando={executando === 'todos'} disabled={executando !== null} icone="chart">
            Comparar os 3 cenários
          </Button>
          {executando && <span className="text-sm text-slate-500">Executando... algoritmos quadráticos com muitos elementos podem levar alguns segundos.</span>}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Cada algoritmo recebe uma cópia independente dos mesmos dados. O tempo exibido é a mediana de 5 execuções (após 1 aquecimento).
        </p>
      </Card>

      {resultado && (
        <Card
          titulo="Resultados"
          subtitulo={`${formatarInteiro(resultado.tamanho)} elementos · ${nomeCenario(resultado.cenario)} · critério: ${CRITERIOS.find((c) => c.valor === resultado.criterio)?.rotulo}`}
          acoes={resultado.equivalentes ? <Badge tom="green">Todos produziram a mesma ordenação</Badge> : <Badge tom="red">Resultados divergentes</Badge>}
          semPadding
        >
          <div className="scroll-thin overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Algoritmo</th>
                  <th className="px-4 py-3 text-right">Comparações</th>
                  <th className="px-4 py-3 text-right">Trocas</th>
                  <th className="px-4 py-3 text-right">Movimentações</th>
                  <th className="px-4 py-3 text-right">Tempo</th>
                  <th className="px-4 py-3 text-center">Ordenado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultado.resultados.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: CORES_ALGORITMO[r.id] }} />
                      {r.algorithm}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatarInteiro(r.comparisons)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatarInteiro(r.swaps)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatarInteiro(r.movements)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${r.executionTime === melhorTempo ? 'font-semibold text-emerald-600' : ''}`}>
                      {formatarTempo(r.executionTime)}
                    </td>
                    <td className="px-4 py-3 text-center">{r.ordenado ? <Badge tom="green">Sim</Badge> : <Badge tom="red">Não</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">Gráficos de desempenho</h3>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={logaritmica} onChange={(e) => setLogaritmica(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Escala logarítmica
              </label>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {METRICAS.map((m) => (
                <div key={m}>
                  <p className="mb-1 text-sm font-medium text-slate-600">{ROTULOS_METRICA[m]}</p>
                  <GraficoMetrica metrica={m} resultados={resultado.resultados} algoritmos={algoritmos} logaritmica={logaritmica} />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-100 p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Amostra do resultado (primeiros 10 elementos)</h3>
            <div className="scroll-thin overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Matrícula</th>
                    <th className="px-3 py-2 text-right">Média</th>
                    <th className="px-3 py-2 text-right">Frequência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultado.amostra.map((a) => (
                    <tr key={a.matricula}>
                      <td className="px-3 py-2 text-slate-500">{a.posicao}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{a.nome}</td>
                      <td className="px-3 py-2 font-mono text-xs">{a.matricula}</td>
                      <td className="px-3 py-2 text-right">{formatarNota(a.media)}</td>
                      <td className="px-3 py-2 text-right">{formatarFrequencia(a.frequencia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {comparacao && (
        <Card
          titulo="Comparação entre cenários"
          subtitulo={`${formatarInteiro(comparacao.aleatorio.tamanho)} elementos · critério: ${CRITERIOS.find((c) => c.valor === comparacao.aleatorio.criterio)?.rotulo}`}
          acoes={
            <div className="flex flex-wrap items-center gap-3">
              <Select value={metricaCenarios} onChange={(e) => setMetricaCenarios(e.target.value as MetricaGrafico)} aria-label="Métrica" className="w-auto">
                {METRICAS.map((m) => (
                  <option key={m} value={m}>
                    {ROTULOS_METRICA[m]}
                  </option>
                ))}
              </Select>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={logaritmica} onChange={(e) => setLogaritmica(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Escala logarítmica
              </label>
            </div>
          }
        >
          <GraficoCenarios metrica={metricaCenarios} comparacao={comparacao} algoritmos={algoritmos} logaritmica={logaritmica} />
          <p className="mt-3 text-sm text-slate-500">
            Observe como Bubble e Insertion Sort colapsam para O(n) em dados ordenados e Quick Sort (pivô no último elemento) degenera para O(n²) nos cenários ordenado e inverso, enquanto o Merge Sort mantém O(n log n) em todos.
          </p>
        </Card>
      )}

      <Card titulo="Complexidade computacional" semPadding>
        <TabelaComplexidade algoritmos={algoritmos} />
        <div className="grid gap-4 border-t border-slate-100 p-5 md:grid-cols-2 xl:grid-cols-3">
          {algoritmos.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES_ALGORITMO[a.id] }} />
                {a.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">{a.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <BuscaMatricula />
    </div>
  );
}
