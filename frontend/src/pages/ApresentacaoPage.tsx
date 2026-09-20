import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, ErrorState, LoadingBlock, PageHeader, Select } from '../components/ui';
import { CORES_ALGORITMO } from '../chartTheme';
import { formatarFrequencia, formatarInteiro, formatarNota, formatarTempo } from '../format';
import { useFetch } from '../hooks/useFetch';
import { AlgorithmId, Cenario, Criterio, InfoOrdenacao, Quadro, ResultadoVisualizacao } from '../types';

const TAMANHOS = [8, 12, 16, 20, 30];

const CRITERIOS: Array<{ valor: Criterio; rotulo: string }> = [
  { valor: 'nota', rotulo: 'Nota (média)' },
  { valor: 'frequencia', rotulo: 'Frequência' },
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'matricula', rotulo: 'Matrícula' }
];

const CENARIOS: Array<{ valor: Cenario; rotulo: string }> = [
  { valor: 'aleatorio', rotulo: 'Aleatório' },
  { valor: 'ordenado', rotulo: 'Ordenado' },
  { valor: 'inverso', rotulo: 'Inversamente ordenado' }
];

const VELOCIDADES = [
  { rotulo: 'Lenta', ms: 450 },
  { rotulo: 'Normal', ms: 160 },
  { rotulo: 'Rápida', ms: 50 },
  { rotulo: 'Muito rápida', ms: 12 }
];

const COR_TIPO: Record<Quadro['tipo'], string> = {
  inicio: '#94a3b8',
  compare: '#f59e0b',
  swap: '#f43f5e',
  move: '#0ea5e9',
  fim: '#10b981'
};

const LEGENDA_TIPO: Array<{ tipo: Quadro['tipo']; rotulo: string }> = [
  { tipo: 'compare', rotulo: 'Comparação' },
  { tipo: 'swap', rotulo: 'Troca' },
  { tipo: 'move', rotulo: 'Movimentação' },
  { tipo: 'fim', rotulo: 'Ordenado' }
];

function Barras({ visualizacao, quadro }: { visualizacao: ResultadoVisualizacao; quadro: Quadro }) {
  const itens = useMemo(() => new Map(visualizacao.itens.map((i) => [i.id, i])), [visualizacao]);
  const maior = useMemo(() => Math.max(...visualizacao.itens.map((i) => i.valor), 1), [visualizacao]);
  const cor = COR_TIPO[quadro.tipo];
  const compacto = visualizacao.tamanho > 20;

  return (
    <div className="flex h-72 items-end gap-1 rounded-xl bg-slate-900 px-3 pb-8 pt-4 sm:gap-1.5" role="img" aria-label="Visualização das barras durante a ordenação">
      {quadro.ordem.map((id, posicao) => {
        const item = itens.get(id);
        if (!item) return null;
        const destacado = quadro.destaques.includes(posicao);
        const altura = Math.max(6, (item.valor / maior) * 100);
        return (
          <div key={id} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
            <div
              className="w-full rounded-t-md transition-[height,background-color] duration-100"
              style={{ height: `${altura}%`, background: quadro.tipo === 'fim' ? cor : destacado ? cor : '#6366f1', opacity: destacado || quadro.tipo === 'fim' ? 1 : 0.85 }}
            />
            <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-slate-300 ${compacto ? 'rotate-[-60deg] text-[9px]' : 'text-[11px]'}`}>
              {item.rotulo}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ApresentacaoPage() {
  const toast = useToast();
  const info = useFetch<InfoOrdenacao>('/api/ordenacao/info');
  const [tamanho, setTamanho] = useState(16);
  const [algoritmo, setAlgoritmo] = useState<AlgorithmId>('bubble');
  const [criterio, setCriterio] = useState<Criterio>('nota');
  const [cenario, setCenario] = useState<Cenario>('aleatorio');
  const [carregando, setCarregando] = useState(false);
  const [visualizacao, setVisualizacao] = useState<ResultadoVisualizacao | null>(null);
  const [indice, setIndice] = useState(0);
  const [executando, setExecutando] = useState(false);
  const [velocidade, setVelocidade] = useState(1);
  const [telaCheia, setTelaCheia] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const total = visualizacao ? visualizacao.quadros.length : 0;
  const ultimo = total - 1;

  const gerar = useCallback(async () => {
    setCarregando(true);
    setExecutando(false);
    try {
      const resultado = await api.post<ResultadoVisualizacao>('/api/ordenacao/visualizar', { tamanho, algoritmo, criterio, cenario });
      setVisualizacao(resultado);
      setIndice(0);
    } catch (falha) {
      toast.error(falha instanceof ApiError ? falha.message : 'Erro ao gerar a visualização.');
    } finally {
      setCarregando(false);
    }
  }, [tamanho, algoritmo, criterio, cenario, toast]);

  useEffect(() => {
    if (!executando || !visualizacao) return;
    if (indice >= ultimo) {
      setExecutando(false);
      return;
    }
    const id = window.setTimeout(() => setIndice((atual) => Math.min(atual + 1, ultimo)), VELOCIDADES[velocidade].ms);
    return () => window.clearTimeout(id);
  }, [executando, indice, ultimo, velocidade, visualizacao]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === 'INPUT' || alvo.tagName === 'SELECT' || alvo.tagName === 'TEXTAREA' || !visualizacao) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setExecutando((atual) => !atual);
      } else if (e.code === 'ArrowRight') {
        setIndice((atual) => Math.min(atual + 1, ultimo));
      } else if (e.code === 'ArrowLeft') {
        setIndice((atual) => Math.max(atual - 1, 0));
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [visualizacao, ultimo]);

  useEffect(() => {
    const aoMudar = () => setTelaCheia(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', aoMudar);
    return () => document.removeEventListener('fullscreenchange', aoMudar);
  }, []);

  const alternarTelaCheia = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await raiz.current?.requestFullscreen();
    } catch {
      toast.error('Não foi possível alternar o modo de tela cheia.');
    }
  };

  if (info.loading && !info.data) return <LoadingBlock />;
  if (info.error || !info.data) return <ErrorState mensagem={info.error ?? 'Sem dados'} onRetry={info.reload} />;

  const quadro = visualizacao ? visualizacao.quadros[Math.min(indice, ultimo)] : null;
  const terminou = visualizacao !== null && indice >= ultimo;
  const algoritmoInfo = info.data.algoritmos.find((a) => a.id === algoritmo);

  return (
    <div ref={raiz} className={`${telaCheia ? 'min-h-full overflow-auto bg-slate-100 p-6' : ''}`}>
      <PageHeader
        titulo="Modo Apresentação"
        subtitulo="Acompanhe passo a passo a execução de cada algoritmo em um conjunto pequeno de alunos"
        acoes={
          <>
            <Button variante="secondary" icone="monitor" onClick={alternarTelaCheia}>
              {telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
            </Button>
            <Link to="/ordenacao" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Icon name="flask" className="h-4 w-4" />
              Laboratório (até 2.000)
            </Link>
          </>
        }
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Algoritmo</span>
            <Select value={algoritmo} onChange={(e) => setAlgoritmo(e.target.value as AlgorithmId)}>
              {info.data.algoritmos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Elementos</span>
            <Select value={tamanho} onChange={(e) => setTamanho(Number(e.target.value))}>
              {TAMANHOS.map((t) => (
                <option key={t} value={t}>
                  {t} alunos
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Critério</span>
            <Select value={criterio} onChange={(e) => setCriterio(e.target.value as Criterio)}>
              {CRITERIOS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Cenário</span>
            <Select value={cenario} onChange={(e) => setCenario(e.target.value as Cenario)}>
              {CENARIOS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end">
            <Button className="w-full" onClick={gerar} carregando={carregando} icone="bolt">
              Gerar visualização
            </Button>
          </div>
        </div>
        {algoritmoInfo && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
            <span className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES_ALGORITMO[algoritmoInfo.id] }} />
              {algoritmoInfo.name}
            </span>
            <span className="font-mono text-xs">
              melhor {algoritmoInfo.best} · médio {algoritmoInfo.average} · pior {algoritmoInfo.worst}
            </span>
            <span className="basis-full">{algoritmoInfo.description}</span>
          </div>
        )}
      </Card>

      {!visualizacao && !carregando && (
        <Card>
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Icon name="play" className="h-7 w-7" />
            </div>
            <p className="font-medium text-slate-800">Escolha os parâmetros e clique em “Gerar visualização”</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">Os alunos são sorteados dos dados cadastrados e as barras representam o critério escolhido.</p>
          </div>
        </Card>
      )}
      {carregando && !visualizacao && <LoadingBlock rotulo="Gerando visualização..." />}

      {visualizacao && quadro && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Card
              titulo={`${visualizacao.algoritmo} · ${visualizacao.tamanho} elementos`}
              subtitulo={`Critério: ${CRITERIOS.find((c) => c.valor === visualizacao.criterio)?.rotulo} · Cenário: ${CENARIOS.find((c) => c.valor === visualizacao.cenario)?.rotulo}`}
              acoes={terminou ? <Badge tom="green">Ordenação concluída</Badge> : <Badge tom="brand">Passo {indice} de {ultimo}</Badge>}
            >
              <Barras visualizacao={visualizacao} quadro={quadro} />
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                {LEGENDA_TIPO.map((l) => (
                  <span key={l.tipo} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_TIPO[l.tipo] }} />
                    {l.rotulo}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                  Elemento em repouso
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    if (terminou) setIndice(0);
                    setExecutando((atual) => !atual);
                  }}
                  icone={executando ? 'pause' : 'play'}
                >
                  {executando ? 'Pausar' : terminou ? 'Repetir' : 'Reproduzir'}
                </Button>
                <Button variante="secondary" icone="left" onClick={() => setIndice((atual) => Math.max(atual - 1, 0))} disabled={indice === 0} aria-label="Passo anterior">
                  Anterior
                </Button>
                <Button variante="secondary" icone="right" onClick={() => setIndice((atual) => Math.min(atual + 1, ultimo))} disabled={terminou} aria-label="Próximo passo">
                  Próximo
                </Button>
                <Button
                  variante="ghost"
                  icone="reset"
                  onClick={() => {
                    setExecutando(false);
                    setIndice(0);
                  }}
                >
                  Reiniciar
                </Button>
                <Button variante="ghost" icone="step" onClick={() => { setExecutando(false); setIndice(ultimo); }}>
                  Ir ao final
                </Button>
                <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
                  Velocidade
                  <Select value={velocidade} onChange={(e) => setVelocidade(Number(e.target.value))} className="w-auto" aria-label="Velocidade">
                    {VELOCIDADES.map((v, i) => (
                      <option key={v.rotulo} value={i}>
                        {v.rotulo}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <input
                type="range"
                min={0}
                max={ultimo}
                value={indice}
                onChange={(e) => {
                  setExecutando(false);
                  setIndice(Number(e.target.value));
                }}
                className="mt-4 w-full accent-indigo-600"
                aria-label="Progresso da execução"
              />
              <p className="mt-2 text-xs text-slate-400">Atalhos: Espaço reproduz/pausa · ← → avançam ou voltam um passo.</p>
            </Card>
          </div>

          <div className="space-y-4">
            <Card titulo="Métricas da execução">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">Elementos</dt>
                  <dd className="text-xl font-bold text-slate-900">{visualizacao.tamanho}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">Tempo (sem animação)</dt>
                  <dd className="text-xl font-bold text-slate-900">{formatarTempo(visualizacao.metricas.executionTime)}</dd>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <dt className="text-xs text-amber-700">Comparações</dt>
                  <dd className="text-xl font-bold text-slate-900">{formatarInteiro(quadro.comparacoes)}</dd>
                  <dd className="text-xs text-slate-400">de {formatarInteiro(visualizacao.metricas.comparisons)}</dd>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  <dt className="text-xs text-rose-700">Trocas</dt>
                  <dd className="text-xl font-bold text-slate-900">{formatarInteiro(quadro.trocas)}</dd>
                  <dd className="text-xs text-slate-400">de {formatarInteiro(visualizacao.metricas.swaps)}</dd>
                </div>
                <div className="col-span-2 rounded-lg bg-sky-50 p-3">
                  <dt className="text-xs text-sky-700">Movimentações</dt>
                  <dd className="text-xl font-bold text-slate-900">{formatarInteiro(quadro.movimentacoes)}</dd>
                  <dd className="text-xs text-slate-400">de {formatarInteiro(visualizacao.metricas.movements)}</dd>
                </div>
              </dl>
            </Card>

            <Card titulo={terminou ? 'Resultado' : 'Resultado (disponível ao final)'} semPadding>
              {terminou ? (
                <div className="max-h-96 overflow-auto scroll-thin">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Aluno</th>
                        <th className="px-3 py-2 text-right">Média</th>
                        <th className="px-3 py-2 text-right">Freq.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visualizacao.resultado.map((r) => (
                        <tr key={r.matricula}>
                          <td className="px-3 py-1.5 text-slate-500">{r.posicao}</td>
                          <td className="px-3 py-1.5">
                            <p className="font-medium text-slate-800">{r.nome}</p>
                            <p className="font-mono text-[11px] text-slate-400">{r.matricula}</p>
                          </td>
                          <td className="px-3 py-1.5 text-right">{formatarNota(r.media)}</td>
                          <td className="px-3 py-1.5 text-right">{formatarFrequencia(r.frequencia)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-slate-500">Conclua a reprodução ou avance até o último passo para ver a lista ordenada.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
