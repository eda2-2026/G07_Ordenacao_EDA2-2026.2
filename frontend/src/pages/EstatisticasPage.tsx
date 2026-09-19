import { useMemo, useState } from 'react';
import { qs } from '../api/client';
import { Icon } from '../components/Icon';
import { Card, ErrorState, LoadingBlock, PageHeader, Select, StatCard } from '../components/ui';
import { formatarFrequencia, formatarInteiro, formatarNota, formatarPercentual } from '../format';
import { useFetch } from '../hooks/useFetch';
import { useOpcoes } from '../hooks/useOpcoes';
import { Estatisticas } from '../types';

export function PainelEstatisticas({ estatisticas }: { estatisticas: Estatisticas }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard rotulo="Maior nota" valor={formatarNota(estatisticas.maiorNota)} icone="up" tom="green" />
      <StatCard rotulo="Menor nota" valor={formatarNota(estatisticas.menorNota)} icone="down" tom="red" />
      <StatCard rotulo="Média" valor={formatarNota(estatisticas.media)} icone="chart" tom="brand" />
      <StatCard rotulo="Mediana" valor={formatarNota(estatisticas.mediana)} detalhe="Calculada sobre os dados ordenados" icone="pie" tom="violet" />
      <StatCard rotulo="Aprovados" valor={formatarInteiro(estatisticas.aprovados)} detalhe={formatarPercentual(estatisticas.taxaAprovacao)} icone="check" tom="green" />
      <StatCard rotulo="Recuperação" valor={formatarInteiro(estatisticas.recuperacao)} detalhe={formatarPercentual(estatisticas.taxaRecuperacao)} icone="reset" tom="amber" />
      <StatCard
        rotulo="Reprovados"
        valor={formatarInteiro(estatisticas.reprovados)}
        detalhe={`${formatarPercentual(estatisticas.taxaReprovacao)} · ${formatarInteiro(estatisticas.reprovadosFrequencia)} por frequência`}
        icone="alert"
        tom="red"
      />
      <StatCard rotulo="Frequência média" valor={formatarFrequencia(estatisticas.frequenciaMedia)} icone="users" tom="sky" />
    </div>
  );
}

export function EstatisticasPage() {
  const opcoes = useOpcoes();
  const [filtros, setFiltros] = useState({ curso: '', periodo: '', disciplinaId: '', professorId: '' });
  const url = useMemo(() => `/api/estatisticas${qs(filtros)}`, [filtros]);
  const { data, loading, error, reload } = useFetch<Estatisticas>(url);

  const alterar = (chave: keyof typeof filtros, valor: string) => setFiltros((atual) => ({ ...atual, [chave]: valor }));

  return (
    <div>
      <PageHeader titulo="Estatísticas" subtitulo="Indicadores calculados sobre os lançamentos de notas" />

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select aria-label="Curso" value={filtros.curso} onChange={(e) => alterar('curso', e.target.value)}>
            <option value="">Todos os cursos</option>
            {opcoes?.cursos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select aria-label="Período" value={filtros.periodo} onChange={(e) => alterar('periodo', e.target.value)}>
            <option value="">Todos os períodos</option>
            {opcoes?.periodos.map((p) => (
              <option key={p} value={p}>
                {p}º período
              </option>
            ))}
          </Select>
          <Select aria-label="Disciplina" value={filtros.disciplinaId} onChange={(e) => alterar('disciplinaId', e.target.value)}>
            <option value="">Todas as disciplinas</option>
            {opcoes?.disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} · {d.nome}
              </option>
            ))}
          </Select>
          <Select aria-label="Professor" value={filtros.professorId} onChange={(e) => alterar('professorId', e.target.value)}>
            <option value="">Todos os professores</option>
            {opcoes?.professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading && !data && <LoadingBlock rotulo="Calculando estatísticas..." />}
      {error && !data && <ErrorState mensagem={error} onRetry={reload} />}
      {data && data.total === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-slate-500">Nenhum lançamento corresponde aos filtros selecionados.</p>
        </Card>
      )}
      {data && data.total > 0 && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          <p className="mb-3 text-sm text-slate-500">
            Baseado em <strong className="text-slate-700">{formatarInteiro(data.total)}</strong> lançamentos.
          </p>
          <PainelEstatisticas estatisticas={data} />
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
            <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <p>
              A <strong>mediana</strong> é o valor central das médias depois de ordená-las com o Merge Sort implementado no projeto: com quantidade ímpar de registros usa-se o elemento do meio; com quantidade par, a média dos dois elementos centrais. O maior e o menor valor correspondem, respectivamente, ao último e ao primeiro elemento do vetor ordenado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
