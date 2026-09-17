import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, ErrorState, LoadingBlock, PageHeader, StatCard } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { formatarInteiro, formatarNota, formatarPercentual } from '../format';
import { Dashboard } from '../types';
import { CORES_SITUACAO, COR_PRIMARIA, EIXO, GRADE, TOOLTIP } from '../chartTheme';

export function DashboardPage() {
  const { data, loading, error, reload } = useFetch<Dashboard>('/api/dashboard');

  if (loading && !data) return <LoadingBlock rotulo="Carregando indicadores..." />;
  if (error || !data) return <ErrorState mensagem={error ?? 'Sem dados'} onRetry={reload} />;

  const { resumo } = data;

  return (
    <div>
      <PageHeader
        titulo="Dashboard"
        subtitulo="Visão consolidada do desempenho acadêmico"
        acoes={
          <Link to="/ordenacao" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
            Abrir laboratório de ordenação
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard rotulo="Total de alunos" valor={formatarInteiro(resumo.totalAlunos)} icone="users" tom="brand" />
        <StatCard rotulo="Total de professores" valor={formatarInteiro(resumo.totalProfessores)} icone="teacher" tom="violet" />
        <StatCard rotulo="Total de disciplinas" valor={formatarInteiro(resumo.totalDisciplinas)} icone="book" tom="sky" />
        <StatCard rotulo="Média geral" valor={formatarNota(resumo.media)} detalhe={`${formatarInteiro(resumo.total)} lançamentos de notas`} icone="chart" tom="brand" />
        <StatCard rotulo="Taxa de aprovação" valor={formatarPercentual(resumo.taxaAprovacao)} detalhe={`${formatarInteiro(resumo.aprovados)} aprovações`} icone="check" tom="green" />
        <StatCard rotulo="Taxa de recuperação" valor={formatarPercentual(resumo.taxaRecuperacao)} detalhe={`${formatarInteiro(resumo.recuperacao)} em recuperação`} icone="reset" tom="amber" />
        <StatCard
          rotulo="Taxa de reprovação"
          valor={formatarPercentual(resumo.taxaReprovacao)}
          detalhe={`${formatarInteiro(resumo.reprovadosNota)} por nota · ${formatarInteiro(resumo.reprovadosFrequencia)} por frequência`}
          icone="alert"
          tom="red"
        />
        <StatCard rotulo="Frequência média" valor={formatarPercentual(resumo.frequenciaMedia)} detalhe="Mínimo exigido: 75%" icone="pie" tom="sky" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card titulo="Distribuição das notas" subtitulo="Quantidade de lançamentos por faixa de média">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribuicao} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid {...GRADE} />
                <XAxis dataKey="faixa" {...EIXO} />
                <YAxis {...EIXO} />
                <Tooltip {...TOOLTIP} formatter={(v) => [formatarInteiro(Number(v)), 'Lançamentos']} />
                <Bar dataKey="quantidade" fill={COR_PRIMARIA} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card titulo="Situação acadêmica" subtitulo="Resultado final dos lançamentos">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.situacao} dataKey="quantidade" nameKey="situacao" innerRadius={62} outerRadius={100} paddingAngle={2}>
                  {data.situacao.map((item) => (
                    <Cell key={item.situacao} fill={CORES_SITUACAO[item.situacao]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP} formatter={(v) => formatarInteiro(Number(v))} />
                <Legend iconType="circle" formatter={(valor) => <span style={{ color: '#475569' }}>{valor}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card titulo="Média por disciplina" subtitulo="Ordenadas da maior para a menor média (Merge Sort)" className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mediaPorDisciplina} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid {...GRADE} />
                <XAxis dataKey="codigo" {...EIXO} interval={0} angle={-55} textAnchor="end" height={64} />
                <YAxis domain={[0, 10]} {...EIXO} />
                <Tooltip
                  {...TOOLTIP}
                  labelFormatter={(codigo) => {
                    const item = data.mediaPorDisciplina.find((d) => d.codigo === codigo);
                    return item ? `${item.codigo} · ${item.nome}` : String(codigo);
                  }}
                  formatter={(v) => [formatarNota(Number(v)), 'Média']}
                />
                <Bar dataKey="media" fill={COR_PRIMARIA} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card titulo="Média por curso" subtitulo="Média geral dos lançamentos dos alunos de cada curso" className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mediaPorCurso} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid {...GRADE} horizontal={false} vertical />
                <XAxis type="number" domain={[0, 10]} {...EIXO} />
                <YAxis type="category" dataKey="curso" width={170} {...EIXO} />
                <Tooltip {...TOOLTIP} formatter={(v) => [formatarNota(Number(v)), 'Média']} />
                <Bar dataKey="media" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
