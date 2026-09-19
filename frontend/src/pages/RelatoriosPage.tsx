import { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Badge, Button, Card, ErrorState, LoadingBlock, PageHeader } from '../components/ui';
import { baixarCsv, formatarFrequencia, formatarInteiro, formatarNota, formatarPercentual } from '../format';
import { useFetch } from '../hooks/useFetch';
import { AlunoRanking, Desempenho, LinhaCurso, LinhaDisciplina } from '../types';
import { PainelEstatisticas } from './EstatisticasPage';

type Aba = 'desempenho' | 'disciplinas' | 'cursos' | 'ranking';

const ABAS: Array<{ id: Aba; rotulo: string }> = [
  { id: 'desempenho', rotulo: 'Desempenho acadêmico' },
  { id: 'disciplinas', rotulo: 'Por disciplina' },
  { id: 'cursos', rotulo: 'Por curso' },
  { id: 'ranking', rotulo: 'Top 10 / Bottom 10' }
];

function Desempenhos() {
  const { data, loading, error, reload } = useFetch<Desempenho>('/api/relatorios/desempenho');
  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <ErrorState mensagem={error ?? 'Sem dados'} onRetry={reload} />;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Consolidado de <strong className="text-slate-700">{formatarInteiro(data.total)}</strong> lançamentos de{' '}
        <strong className="text-slate-700">{formatarInteiro(data.totalAlunos)}</strong> alunos em{' '}
        <strong className="text-slate-700">{formatarInteiro(data.totalDisciplinas)}</strong> disciplinas.
      </p>
      <PainelEstatisticas estatisticas={data} />
    </div>
  );
}

function PorDisciplina() {
  const { data, loading, error, reload } = useFetch<LinhaDisciplina[]>('/api/relatorios/disciplinas');
  const exportar = () => {
    if (!data) return;
    baixarCsv(
      'relatorio-por-disciplina.csv',
      ['Código', 'Disciplina', 'Professor', 'Quantidade', 'Média', 'Aprovação (%)', 'Reprovação (%)', 'Frequência média (%)'],
      data.map((l) => [l.codigo, l.nome, l.professor, l.quantidade, l.media, l.taxaAprovacao, l.taxaReprovacao, l.frequenciaMedia])
    );
  };
  return (
    <Card
      semPadding
      titulo="Desempenho por disciplina"
      subtitulo="Ordenado da maior para a menor média"
      acoes={
        <Button variante="secondary" icone="download" onClick={exportar} disabled={!data}>
          Exportar CSV
        </Button>
      }
    >
      <DataTable<LinhaDisciplina>
        itens={data ?? undefined}
        carregando={loading}
        erro={error}
        onRetry={reload}
        chaveDe={(l) => l.disciplinaId}
        colunas={[
          { chave: 'codigo', titulo: 'Código', render: (l) => <span className="font-mono text-xs font-medium">{l.codigo}</span> },
          {
            chave: 'nome',
            titulo: 'Disciplina',
            render: (l) => (
              <div>
                <p className="font-medium text-slate-900">{l.nome}</p>
                <p className="text-xs text-slate-400">{l.professor}</p>
              </div>
            )
          },
          { chave: 'quantidade', titulo: 'Quantidade', alinhamento: 'right', render: (l) => formatarInteiro(l.quantidade) },
          { chave: 'media', titulo: 'Média', alinhamento: 'right', render: (l) => <strong>{formatarNota(l.media)}</strong> },
          { chave: 'aprovacao', titulo: 'Aprovação', alinhamento: 'right', render: (l) => <span className="text-emerald-600">{formatarPercentual(l.taxaAprovacao)}</span> },
          { chave: 'reprovacao', titulo: 'Reprovação', alinhamento: 'right', render: (l) => <span className="text-rose-600">{formatarPercentual(l.taxaReprovacao)}</span> },
          { chave: 'frequencia', titulo: 'Freq. média', alinhamento: 'right', render: (l) => formatarFrequencia(l.frequenciaMedia) }
        ]}
      />
    </Card>
  );
}

function PorCurso() {
  const { data, loading, error, reload } = useFetch<LinhaCurso[]>('/api/relatorios/cursos');
  const exportar = () => {
    if (!data) return;
    baixarCsv(
      'relatorio-por-curso.csv',
      ['Curso', 'Alunos', 'Lançamentos', 'Média', 'Aprovação (%)', 'Reprovação (%)'],
      data.map((l) => [l.curso, l.alunos, l.registros, l.media, l.taxaAprovacao, l.taxaReprovacao])
    );
  };
  return (
    <Card
      semPadding
      titulo="Desempenho por curso"
      subtitulo="Ordenado da maior para a menor média"
      acoes={
        <Button variante="secondary" icone="download" onClick={exportar} disabled={!data}>
          Exportar CSV
        </Button>
      }
    >
      <DataTable<LinhaCurso>
        itens={data ?? undefined}
        carregando={loading}
        erro={error}
        onRetry={reload}
        chaveDe={(l) => l.curso}
        colunas={[
          { chave: 'curso', titulo: 'Curso', render: (l) => <span className="font-medium text-slate-900">{l.curso}</span> },
          { chave: 'alunos', titulo: 'Alunos', alinhamento: 'right', render: (l) => formatarInteiro(l.alunos) },
          { chave: 'registros', titulo: 'Lançamentos', alinhamento: 'right', render: (l) => formatarInteiro(l.registros) },
          { chave: 'media', titulo: 'Média', alinhamento: 'right', render: (l) => <strong>{formatarNota(l.media)}</strong> },
          { chave: 'aprovacao', titulo: 'Taxa de aprovação', alinhamento: 'right', render: (l) => <span className="text-emerald-600">{formatarPercentual(l.taxaAprovacao)}</span> },
          { chave: 'reprovacao', titulo: 'Taxa de reprovação', alinhamento: 'right', render: (l) => <span className="text-rose-600">{formatarPercentual(l.taxaReprovacao)}</span> }
        ]}
      />
    </Card>
  );
}

function TabelaExtremos({ titulo, subtitulo, itens }: { titulo: string; subtitulo: string; itens: AlunoRanking[] }) {
  return (
    <Card semPadding titulo={titulo} subtitulo={subtitulo}>
      <DataTable<AlunoRanking>
        itens={itens}
        chaveDe={(a) => a.id}
        colunas={[
          { chave: 'posicao', titulo: '#', alinhamento: 'center', render: (_a, indice) => `${indice + 1}º` },
          {
            chave: 'nome',
            titulo: 'Aluno',
            render: (a) => (
              <div>
                <p className="font-medium text-slate-900">{a.nome}</p>
                <p className="text-xs text-slate-400">{a.curso}</p>
              </div>
            )
          },
          { chave: 'media', titulo: 'Média', alinhamento: 'right', render: (a) => <strong>{formatarNota(a.media)}</strong> },
          { chave: 'frequencia', titulo: 'Freq.', alinhamento: 'right', render: (a) => formatarFrequencia(a.frequencia) },
          { chave: 'status', titulo: 'Status', render: (a) => <Badge>{a.status}</Badge> }
        ]}
      />
    </Card>
  );
}

function Extremos() {
  const { data, loading, error, reload } = useFetch<{ top: AlunoRanking[]; bottom: AlunoRanking[] }>('/api/relatorios/ranking');
  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <ErrorState mensagem={error ?? 'Sem dados'} onRetry={reload} />;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <TabelaExtremos titulo="Top 10" subtitulo="Maiores médias gerais" itens={data.top} />
      <TabelaExtremos titulo="Bottom 10" subtitulo="Menores médias gerais" itens={data.bottom} />
    </div>
  );
}

export function RelatoriosPage() {
  const [aba, setAba] = useState<Aba>('desempenho');
  return (
    <div>
      <PageHeader titulo="Relatórios" subtitulo="Consolidados acadêmicos por período, disciplina, curso e ranking" />
      <div className="scroll-thin mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-200/70 p-1" role="tablist">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={aba === item.id}
            onClick={() => setAba(item.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              aba === item.id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>
      {aba === 'desempenho' && <Desempenhos />}
      {aba === 'disciplinas' && <PorDisciplina />}
      {aba === 'cursos' && <PorCurso />}
      {aba === 'ranking' && <Extremos />}
    </div>
  );
}
