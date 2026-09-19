import { Link } from 'react-router-dom';
import { DataTable, Paginacao } from '../components/DataTable';
import { Badge, Card, PageHeader, Select, StatCard } from '../components/ui';
import { formatarFrequencia, formatarInteiro, formatarNota } from '../format';
import { useListagem } from '../hooks/useListagem';
import { useOpcoes } from '../hooks/useOpcoes';
import { AlunoRanking, Pagina } from '../types';

type AlunoAlerta = AlunoRanking & { motivo: string };
type RespostaAlertas = Pagina<AlunoAlerta> & { resumo: { total: number; porMedia: number; porFrequencia: number; ambos: number } };

const FILTROS_INICIAIS = { curso: '', motivo: '' };

export function AlertasPage() {
  const opcoes = useOpcoes();
  const lista = useListagem<AlunoAlerta>('/api/alertas', FILTROS_INICIAIS);
  const resumo = (lista.data as RespostaAlertas | null)?.resumo;

  return (
    <div>
      <PageHeader titulo="Alunos que precisam de atenção" subtitulo="Média geral abaixo de 5,0 ou frequência média abaixo de 75%" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard rotulo="Alunos em alerta" valor={resumo ? formatarInteiro(resumo.total) : '—'} icone="alert" tom="red" />
        <StatCard rotulo="Média abaixo de 5,0" valor={resumo ? formatarInteiro(resumo.porMedia) : '—'} icone="down" tom="amber" />
        <StatCard rotulo="Frequência abaixo de 75%" valor={resumo ? formatarInteiro(resumo.porFrequencia) : '—'} icone="users" tom="sky" />
        <StatCard rotulo="Ambos os critérios" valor={resumo ? formatarInteiro(resumo.ambos) : '—'} icone="bolt" tom="violet" />
      </div>

      <Card semPadding>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select aria-label="Curso" value={lista.filtros.curso} onChange={(e) => lista.definirFiltro('curso', e.target.value)}>
            <option value="">Todos os cursos</option>
            {opcoes?.cursos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select aria-label="Motivo" value={lista.filtros.motivo} onChange={(e) => lista.definirFiltro('motivo', e.target.value)}>
            <option value="">Todos os motivos</option>
            <option value="media">Média abaixo de 5,0</option>
            <option value="frequencia">Frequência abaixo de 75%</option>
          </Select>
        </div>
        <DataTable<AlunoAlerta>
          itens={lista.data?.itens}
          carregando={lista.loading}
          erro={lista.error}
          onRetry={lista.reload}
          chaveDe={(a) => a.id}
          vazioTitulo="Nenhum aluno em situação de alerta"
          vazioDescricao="Nenhum aluno atende aos critérios com os filtros atuais."
          colunas={[
            {
              chave: 'nome',
              titulo: 'Aluno',
              render: (a) => (
                <div>
                  <p className="font-medium text-slate-900">{a.nome}</p>
                  <p className="text-xs text-slate-400">
                    <span className="font-mono">{a.matricula}</span> · {a.curso}
                  </p>
                </div>
              )
            },
            {
              chave: 'media',
              titulo: 'Média',
              alinhamento: 'right',
              render: (a) => <strong className={a.media < 5 ? 'text-rose-600' : ''}>{formatarNota(a.media)}</strong>
            },
            {
              chave: 'frequencia',
              titulo: 'Frequência',
              alinhamento: 'right',
              render: (a) => <strong className={a.frequencia < 75 ? 'text-rose-600' : ''}>{formatarFrequencia(a.frequencia)}</strong>
            },
            { chave: 'motivo', titulo: 'Motivo', render: (a) => <Badge tom={a.media < 5 ? 'red' : 'orange'}>{a.motivo}</Badge> },
            {
              chave: 'acoes',
              titulo: '',
              alinhamento: 'right',
              render: (a) => (
                <Link to={`/alunos`} state={{ busca: a.matricula }} className="text-xs font-medium text-brand-600 hover:underline">
                  Ver em Alunos
                </Link>
              )
            }
          ]}
        />
        <Paginacao pagina={lista.data} onMudar={lista.irParaPagina} />
      </Card>
    </div>
  );
}
