import { FormEvent, useState } from 'react';
import { api, ApiError } from '../api/client';
import { DataTable, Paginacao } from '../components/DataTable';
import { ConfirmDialog, Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, ErrorState, Field, IconButton, Input, LoadingBlock, PageHeader, SearchInput, Select } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { useListagem } from '../hooks/useListagem';
import { invalidarOpcoes, useOpcoes } from '../hooks/useOpcoes';
import { DisciplinaResumo, Professor, ProfessorListado } from '../types';

const FILTROS_INICIAIS = { busca: '', departamento: '', status: '' };

interface FormProfessor {
  nome: string;
  matricula: string;
  email: string;
  especialidade: string;
  departamento: string;
  status: string;
}

const FORM_VAZIO: FormProfessor = { nome: '', matricula: '', email: '', especialidade: '', departamento: '', status: 'Ativo' };

function validar(form: FormProfessor): Record<string, string> {
  const erros: Record<string, string> = {};
  if (form.nome.trim().length < 3) erros.nome = 'Informe o nome completo (mín. 3 caracteres)';
  if (form.matricula.trim().length < 3) erros.matricula = 'Informe a matrícula (mín. 3 caracteres)';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) erros.email = 'E-mail inválido';
  if (form.especialidade.trim().length < 3) erros.especialidade = 'Informe a especialidade';
  if (!form.departamento) erros.departamento = 'Selecione o departamento';
  return erros;
}

function ProfessorFormModal({ professor, onFechar, onSalvo }: { professor: Professor | null; onFechar: () => void; onSalvo: () => void }) {
  const opcoes = useOpcoes();
  const toast = useToast();
  const [form, setForm] = useState<FormProfessor>(
    professor
      ? {
          nome: professor.nome,
          matricula: professor.matricula,
          email: professor.email,
          especialidade: professor.especialidade,
          departamento: professor.departamento,
          status: professor.status
        }
      : FORM_VAZIO
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo: keyof FormProfessor, valor: string) => {
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
    try {
      if (professor) await api.put(`/api/professores/${professor.id}`, form);
      else await api.post('/api/professores', form);
      invalidarOpcoes();
      toast.success(professor ? 'Professor atualizado com sucesso.' : 'Professor cadastrado com sucesso.');
      onSalvo();
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) setErros(falha.campos);
      else toast.error(falha instanceof ApiError ? falha.message : 'Erro ao salvar o professor.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto
      titulo={professor ? 'Editar professor' : 'Novo professor'}
      onFechar={onFechar}
      rodape={
        <>
          <Button variante="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-professor" carregando={salvando} icone="check">
            Salvar
          </Button>
        </>
      }
    >
      <form id="form-professor" onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field rotulo="Nome" erro={erros.nome} className="sm:col-span-2">
          <Input value={form.nome} onChange={(e) => alterar('nome', e.target.value)} invalido={!!erros.nome} autoFocus />
        </Field>
        <Field rotulo="Matrícula" erro={erros.matricula}>
          <Input value={form.matricula} onChange={(e) => alterar('matricula', e.target.value)} invalido={!!erros.matricula} />
        </Field>
        <Field rotulo="E-mail" erro={erros.email}>
          <Input type="email" value={form.email} onChange={(e) => alterar('email', e.target.value)} invalido={!!erros.email} />
        </Field>
        <Field rotulo="Departamento" erro={erros.departamento}>
          <Select value={form.departamento} onChange={(e) => alterar('departamento', e.target.value)} invalido={!!erros.departamento}>
            <option value="">Selecione...</option>
            {opcoes?.departamentos.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field rotulo="Especialidade" erro={erros.especialidade}>
          <Input value={form.especialidade} onChange={(e) => alterar('especialidade', e.target.value)} invalido={!!erros.especialidade} />
        </Field>
        <Field rotulo="Status">
          <Select value={form.status} onChange={(e) => alterar('status', e.target.value)}>
            {(opcoes?.statusProfessor ?? ['Ativo', 'Afastado', 'Inativo']).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

function ProfessorDetalhes({ id, onFechar }: { id: number; onFechar: () => void }) {
  const { data, loading, error, reload } = useFetch<{ professor: Professor; disciplinas: DisciplinaResumo[]; quantidadeNotas: number }>(
    `/api/professores/${id}`
  );
  return (
    <Modal aberto titulo="Detalhes do professor" onFechar={onFechar} rodape={<Button variante="secondary" onClick={onFechar}>Fechar</Button>}>
      {loading && !data && <LoadingBlock />}
      {error && !data && <ErrorState mensagem={error} onRetry={reload} />}
      {data && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{data.professor.nome}</h3>
              <p className="text-sm text-slate-500">
                Matrícula {data.professor.matricula} · {data.professor.email}
              </p>
            </div>
            <Badge>{data.professor.status}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
            <div>
              <dt className="text-slate-500">Departamento</dt>
              <dd className="font-medium text-slate-800">{data.professor.departamento}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Especialidade</dt>
              <dd className="font-medium text-slate-800">{data.professor.especialidade}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Disciplinas ministradas</dt>
              <dd className="font-medium text-slate-800">{data.disciplinas.length}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Lançamentos de notas</dt>
              <dd className="font-medium text-slate-800">{data.quantidadeNotas}</dd>
            </div>
          </dl>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Disciplinas</h4>
            {data.disciplinas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma disciplina vinculada.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {data.disciplinas.map((d) => (
                  <li key={d.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-slate-500">{d.codigo}</span> · {d.nome}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export function ProfessoresPage() {
  const opcoes = useOpcoes();
  const toast = useToast();
  const lista = useListagem<ProfessorListado>('/api/professores', FILTROS_INICIAIS);
  const [edicao, setEdicao] = useState<{ professor: Professor | null } | null>(null);
  const [detalhe, setDetalhe] = useState<number | null>(null);
  const [exclusao, setExclusao] = useState<ProfessorListado | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const confirmarExclusao = async () => {
    if (!exclusao) return;
    setExcluindo(true);
    try {
      await api.delete(`/api/professores/${exclusao.id}`);
      invalidarOpcoes();
      toast.success('Professor excluído com sucesso.');
      setExclusao(null);
      lista.reload();
    } catch (falha) {
      toast.error(falha instanceof ApiError ? falha.message : 'Erro ao excluir o professor.');
      setExclusao(null);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Professores"
        subtitulo="Corpo docente e disciplinas ministradas"
        acoes={
          <Button icone="plus" onClick={() => setEdicao({ professor: null })}>
            Novo professor
          </Button>
        }
      />

      <Card semPadding>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <SearchInput valor={lista.filtros.busca} onChange={(v) => lista.definirFiltro('busca', v)} />
          </div>
          <Select aria-label="Departamento" value={lista.filtros.departamento} onChange={(e) => lista.definirFiltro('departamento', e.target.value)}>
            <option value="">Todos os departamentos</option>
            {opcoes?.departamentos.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
          <Select aria-label="Status" value={lista.filtros.status} onChange={(e) => lista.definirFiltro('status', e.target.value)}>
            <option value="">Todos os status</option>
            {opcoes?.statusProfessor.map((s) => (
              <option key={s}>{s}</option>
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
        <DataTable<ProfessorListado>
          itens={lista.data?.itens}
          carregando={lista.loading}
          erro={lista.error}
          onRetry={lista.reload}
          chaveDe={(p) => p.id}
          ordenacao={lista.ordenacao}
          onOrdenar={lista.alternarOrdenacao}
          vazioTitulo="Nenhum professor encontrado"
          colunas={[
            { chave: 'matricula', titulo: 'Matrícula', ordenavel: true, render: (p) => <span className="font-mono text-xs">{p.matricula}</span> },
            {
              chave: 'nome',
              titulo: 'Nome',
              ordenavel: true,
              render: (p) => (
                <div>
                  <p className="font-medium text-slate-900">{p.nome}</p>
                  <p className="text-xs text-slate-400">{p.email}</p>
                </div>
              )
            },
            { chave: 'departamento', titulo: 'Departamento', ordenavel: true, render: (p) => p.departamento },
            { chave: 'especialidade', titulo: 'Especialidade', ordenavel: true, render: (p) => p.especialidade },
            {
              chave: 'disciplinas',
              titulo: 'Disciplinas',
              render: (p) =>
                p.disciplinas.length === 0 ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {p.disciplinas.map((d) => (
                      <span key={d.id} title={d.nome} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                        {d.codigo}
                      </span>
                    ))}
                  </div>
                )
            },
            { chave: 'status', titulo: 'Status', ordenavel: true, render: (p) => <Badge>{p.status}</Badge> },
            {
              chave: 'acoes',
              titulo: 'Ações',
              alinhamento: 'right',
              render: (p) => (
                <div className="flex justify-end gap-1">
                  <IconButton icone="eye" titulo="Visualizar" tom="brand" onClick={() => setDetalhe(p.id)} />
                  <IconButton icone="pencil" titulo="Editar" tom="brand" onClick={() => setEdicao({ professor: p })} />
                  <IconButton icone="trash" titulo="Excluir" tom="rose" onClick={() => setExclusao(p)} />
                </div>
              )
            }
          ]}
        />
        <Paginacao pagina={lista.data} onMudar={lista.irParaPagina} />
      </Card>

      {edicao && (
        <ProfessorFormModal
          professor={edicao.professor}
          onFechar={() => setEdicao(null)}
          onSalvo={() => {
            setEdicao(null);
            lista.reload();
          }}
        />
      )}
      {detalhe !== null && <ProfessorDetalhes id={detalhe} onFechar={() => setDetalhe(null)} />}
      <ConfirmDialog
        aberto={exclusao !== null}
        titulo="Excluir professor"
        carregando={excluindo}
        onCancelar={() => setExclusao(null)}
        onConfirmar={confirmarExclusao}
        mensagem={
          <>
            Deseja realmente excluir o professor <strong>{exclusao?.nome}</strong>? Esta ação não pode ser desfeita.
          </>
        }
      />
    </div>
  );
}
