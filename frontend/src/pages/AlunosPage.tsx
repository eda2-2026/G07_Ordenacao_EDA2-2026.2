import { FormEvent, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { DataTable, Paginacao } from '../components/DataTable';
import { ConfirmDialog, Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, ErrorState, Field, IconButton, Input, LoadingBlock, PageHeader, SearchInput, Select } from '../components/ui';
import { formatarFrequencia, formatarNota } from '../format';
import { useFetch } from '../hooks/useFetch';
import { useListagem } from '../hooks/useListagem';
import { useOpcoes } from '../hooks/useOpcoes';
import { Aluno, AlunoListado, NotaDoAluno, AlunoRanking } from '../types';

const FILTROS_INICIAIS = { busca: '', curso: '', periodo: '', status: '', disciplinaId: '', professorId: '' };

interface FormAluno {
  nome: string;
  matricula: string;
  email: string;
  idade: string;
  curso: string;
  periodo: string;
  status: string;
}

const FORM_VAZIO: FormAluno = { nome: '', matricula: '', email: '', idade: '', curso: '', periodo: '1', status: 'Ativo' };

function validar(form: FormAluno): Record<string, string> {
  const erros: Record<string, string> = {};
  if (form.nome.trim().length < 3) erros.nome = 'Informe o nome completo (mín. 3 caracteres)';
  if (form.matricula.trim().length < 3) erros.matricula = 'Informe a matrícula (mín. 3 caracteres)';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) erros.email = 'E-mail inválido';
  const idade = Number(form.idade);
  if (!Number.isInteger(idade) || idade < 14 || idade > 100) erros.idade = 'Idade deve estar entre 14 e 100';
  if (!form.curso) erros.curso = 'Selecione o curso';
  const periodo = Number(form.periodo);
  if (!Number.isInteger(periodo) || periodo < 1 || periodo > 10) erros.periodo = 'Período deve estar entre 1 e 10';
  return erros;
}

function AlunoFormModal({ aluno, onFechar, onSalvo }: { aluno: Aluno | null; onFechar: () => void; onSalvo: () => void }) {
  const opcoes = useOpcoes();
  const toast = useToast();
  const [form, setForm] = useState<FormAluno>(
    aluno
      ? {
          nome: aluno.nome,
          matricula: aluno.matricula,
          email: aluno.email,
          idade: String(aluno.idade),
          curso: aluno.curso,
          periodo: String(aluno.periodo),
          status: aluno.status
        }
      : FORM_VAZIO
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo: keyof FormAluno, valor: string) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: '' }));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const encontrados = validar(form);
    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados);
      return;
    }
    setSalvando(true);
    const corpo = { ...form, idade: Number(form.idade), periodo: Number(form.periodo) };
    try {
      if (aluno) await api.put(`/api/alunos/${aluno.id}`, corpo);
      else await api.post('/api/alunos', corpo);
      toast.success(aluno ? 'Aluno atualizado com sucesso.' : 'Aluno cadastrado com sucesso.');
      onSalvo();
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) setErros(falha.campos);
      else toast.error(falha instanceof ApiError ? falha.message : 'Erro ao salvar o aluno.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto
      titulo={aluno ? 'Editar aluno' : 'Novo aluno'}
      onFechar={onFechar}
      rodape={
        <>
          <Button variante="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-aluno" carregando={salvando} icone="check">
            Salvar
          </Button>
        </>
      }
    >
      <form id="form-aluno" onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field rotulo="Nome" erro={erros.nome} className="sm:col-span-2">
          <Input value={form.nome} onChange={(e) => alterar('nome', e.target.value)} invalido={!!erros.nome} autoFocus />
        </Field>
        <Field rotulo="Matrícula" erro={erros.matricula}>
          <Input value={form.matricula} onChange={(e) => alterar('matricula', e.target.value)} invalido={!!erros.matricula} />
        </Field>
        <Field rotulo="E-mail" erro={erros.email}>
          <Input type="email" value={form.email} onChange={(e) => alterar('email', e.target.value)} invalido={!!erros.email} />
        </Field>
        <Field rotulo="Idade" erro={erros.idade}>
          <Input type="number" min={14} max={100} value={form.idade} onChange={(e) => alterar('idade', e.target.value)} invalido={!!erros.idade} />
        </Field>
        <Field rotulo="Período" erro={erros.periodo}>
          <Select value={form.periodo} onChange={(e) => alterar('periodo', e.target.value)} invalido={!!erros.periodo}>
            {(opcoes?.periodos ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).map((p) => (
              <option key={p} value={p}>
                {p}º período
              </option>
            ))}
          </Select>
        </Field>
        <Field rotulo="Curso" erro={erros.curso}>
          <Select value={form.curso} onChange={(e) => alterar('curso', e.target.value)} invalido={!!erros.curso}>
            <option value="">Selecione...</option>
            {opcoes?.cursos.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field rotulo="Status" erro={erros.status}>
          <Select value={form.status} onChange={(e) => alterar('status', e.target.value)}>
            {(opcoes?.statusAluno ?? ['Ativo', 'Trancado', 'Inativo']).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

function AlunoDetalhes({ id, onFechar }: { id: number; onFechar: () => void }) {
  const { data, loading, error, reload } = useFetch<{ aluno: Aluno; resumo: AlunoRanking | null; notas: NotaDoAluno[] }>(`/api/alunos/${id}`);

  return (
    <Modal aberto titulo="Detalhes do aluno" onFechar={onFechar} largura="xl" rodape={<Button variante="secondary" onClick={onFechar}>Fechar</Button>}>
      {loading && !data && <LoadingBlock />}
      {error && !data && <ErrorState mensagem={error} onRetry={reload} />}
      {data && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{data.aluno.nome}</h3>
              <p className="text-sm text-slate-500">
                Matrícula {data.aluno.matricula} · {data.aluno.email}
              </p>
            </div>
            <Badge>{data.aluno.status}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Curso</dt>
              <dd className="font-medium text-slate-800">{data.aluno.curso}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Período</dt>
              <dd className="font-medium text-slate-800">{data.aluno.periodo}º</dd>
            </div>
            <div>
              <dt className="text-slate-500">Idade</dt>
              <dd className="font-medium text-slate-800">{data.aluno.idade} anos</dd>
            </div>
            <div>
              <dt className="text-slate-500">Situação geral</dt>
              <dd>{data.resumo ? <Badge>{data.resumo.status}</Badge> : <span className="text-slate-400">Sem notas</span>}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Média geral</dt>
              <dd className="font-medium text-slate-800">{formatarNota(data.resumo?.media)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Frequência média</dt>
              <dd className="font-medium text-slate-800">{formatarFrequencia(data.resumo?.frequencia)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Disciplinas cursadas</dt>
              <dd className="font-medium text-slate-800">{data.notas.length}</dd>
            </div>
          </dl>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Notas por disciplina</h4>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <DataTable<NotaDoAluno>
                itens={data.notas}
                chaveDe={(n) => n.id}
                vazioTitulo="Nenhuma nota lançada"
                vazioDescricao="Este aluno ainda não possui lançamentos."
                colunas={[
                  { chave: 'disciplina', titulo: 'Disciplina', render: (n) => `${n.disciplinaCodigo} · ${n.disciplinaNome}` },
                  { chave: 'professor', titulo: 'Professor', render: (n) => n.professorNome },
                  { chave: 'n1', titulo: 'N1', alinhamento: 'right', render: (n) => formatarNota(n.nota1) },
                  { chave: 'n2', titulo: 'N2', alinhamento: 'right', render: (n) => formatarNota(n.nota2) },
                  { chave: 'n3', titulo: 'N3', alinhamento: 'right', render: (n) => formatarNota(n.nota3) },
                  { chave: 'media', titulo: 'Média', alinhamento: 'right', render: (n) => <strong>{formatarNota(n.media)}</strong> },
                  { chave: 'freq', titulo: 'Freq.', alinhamento: 'right', render: (n) => formatarFrequencia(n.frequencia) },
                  { chave: 'status', titulo: 'Situação', render: (n) => <Badge>{n.status}</Badge> }
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function AlunosPage() {
  const opcoes = useOpcoes();
  const toast = useToast();
  const local = useLocation();
  const [filtrosIniciais] = useState(() => ({
    ...FILTROS_INICIAIS,
    busca: typeof (local.state as { busca?: unknown } | null)?.busca === 'string' ? (local.state as { busca: string }).busca : ''
  }));
  const lista = useListagem<AlunoListado>('/api/alunos', filtrosIniciais);
  const [edicao, setEdicao] = useState<{ aluno: Aluno | null } | null>(null);
  const [detalhe, setDetalhe] = useState<number | null>(null);
  const [exclusao, setExclusao] = useState<AlunoListado | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const confirmarExclusao = async () => {
    if (!exclusao) return;
    setExcluindo(true);
    try {
      const resultado = await api.delete<{ notasRemovidas: number }>(`/api/alunos/${exclusao.id}`);
      toast.success(`Aluno excluído (${resultado.notasRemovidas} lançamento(s) de nota removido(s)).`);
      setExclusao(null);
      lista.reload();
    } catch (falha) {
      toast.error(falha instanceof ApiError ? falha.message : 'Erro ao excluir o aluno.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Alunos"
        subtitulo="Cadastro e consulta de alunos"
        acoes={
          <Button icone="plus" onClick={() => setEdicao({ aluno: null })}>
            Novo aluno
          </Button>
        }
      />

      <Card semPadding>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <SearchInput valor={lista.filtros.busca} onChange={(v) => lista.definirFiltro('busca', v)} />
          </div>
          <Select aria-label="Curso" value={lista.filtros.curso} onChange={(e) => lista.definirFiltro('curso', e.target.value)}>
            <option value="">Todos os cursos</option>
            {opcoes?.cursos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select aria-label="Período" value={lista.filtros.periodo} onChange={(e) => lista.definirFiltro('periodo', e.target.value)}>
            <option value="">Todos os períodos</option>
            {opcoes?.periodos.map((p) => (
              <option key={p} value={p}>
                {p}º período
              </option>
            ))}
          </Select>
          <Select aria-label="Status" value={lista.filtros.status} onChange={(e) => lista.definirFiltro('status', e.target.value)}>
            <option value="">Todos os status</option>
            {opcoes?.statusAluno.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select aria-label="Disciplina" value={lista.filtros.disciplinaId} onChange={(e) => lista.definirFiltro('disciplinaId', e.target.value)}>
            <option value="">Todas as disciplinas</option>
            {opcoes?.disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} · {d.nome}
              </option>
            ))}
          </Select>
          <Select aria-label="Professor" value={lista.filtros.professorId} onChange={(e) => lista.definirFiltro('professorId', e.target.value)}>
            <option value="">Todos os professores</option>
            {opcoes?.professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </div>
        {lista.temFiltroAtivo && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-brand-50/50 px-4 py-2 text-sm text-brand-700">
            <span>Filtros aplicados</span>
            <button type="button" className="font-medium underline" onClick={lista.limparFiltros}>
              Limpar filtros
            </button>
          </div>
        )}

        <DataTable<AlunoListado>
          itens={lista.data?.itens}
          carregando={lista.loading}
          erro={lista.error}
          onRetry={lista.reload}
          chaveDe={(a) => a.id}
          ordenacao={lista.ordenacao}
          onOrdenar={lista.alternarOrdenacao}
          vazioTitulo="Nenhum aluno encontrado"
          colunas={[
            { chave: 'matricula', titulo: 'Matrícula', ordenavel: true, render: (a) => <span className="font-mono text-xs">{a.matricula}</span> },
            {
              chave: 'nome',
              titulo: 'Nome',
              ordenavel: true,
              render: (a) => (
                <div>
                  <p className="font-medium text-slate-900">{a.nome}</p>
                  <p className="text-xs text-slate-400">{a.email}</p>
                </div>
              )
            },
            { chave: 'curso', titulo: 'Curso', ordenavel: true, render: (a) => a.curso },
            { chave: 'periodo', titulo: 'Período', ordenavel: true, alinhamento: 'center', render: (a) => `${a.periodo}º` },
            { chave: 'media', titulo: 'Média', ordenavel: true, alinhamento: 'right', render: (a) => formatarNota(a.media) },
            { chave: 'situacao', titulo: 'Situação', render: (a) => (a.situacao ? <Badge>{a.situacao}</Badge> : <span className="text-slate-400">—</span>) },
            { chave: 'status', titulo: 'Status', ordenavel: true, render: (a) => <Badge>{a.status}</Badge> },
            {
              chave: 'acoes',
              titulo: 'Ações',
              alinhamento: 'right',
              render: (a) => (
                <div className="flex justify-end gap-1">
                  <IconButton icone="eye" titulo="Ver detalhes" tom="brand" onClick={() => setDetalhe(a.id)} />
                  <IconButton icone="pencil" titulo="Editar" tom="brand" onClick={() => setEdicao({ aluno: a })} />
                  <IconButton icone="trash" titulo="Excluir" tom="rose" onClick={() => setExclusao(a)} />
                </div>
              )
            }
          ]}
        />
        <Paginacao pagina={lista.data} onMudar={lista.irParaPagina} />
      </Card>

      {edicao && (
        <AlunoFormModal
          aluno={edicao.aluno}
          onFechar={() => setEdicao(null)}
          onSalvo={() => {
            setEdicao(null);
            lista.reload();
          }}
        />
      )}
      {detalhe !== null && <AlunoDetalhes id={detalhe} onFechar={() => setDetalhe(null)} />}
      <ConfirmDialog
        aberto={exclusao !== null}
        titulo="Excluir aluno"
        carregando={excluindo}
        onCancelar={() => setExclusao(null)}
        onConfirmar={confirmarExclusao}
        mensagem={
          <>
            Deseja realmente excluir <strong>{exclusao?.nome}</strong> (matrícula {exclusao?.matricula})? Todos os lançamentos de notas deste aluno também serão removidos. Esta ação não pode ser desfeita.
          </>
        }
      />
    </div>
  );
}
