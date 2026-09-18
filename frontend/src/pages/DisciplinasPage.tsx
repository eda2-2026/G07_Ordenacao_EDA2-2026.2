import { FormEvent, useState } from 'react';
import { api, ApiError } from '../api/client';
import { DataTable, Paginacao } from '../components/DataTable';
import { ConfirmDialog, Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, Field, IconButton, Input, PageHeader, SearchInput, Select } from '../components/ui';
import { useListagem } from '../hooks/useListagem';
import { invalidarOpcoes, useOpcoes } from '../hooks/useOpcoes';
import { Disciplina, DisciplinaListada } from '../types';

const FILTROS_INICIAIS = { busca: '', periodo: '', status: '', professorId: '' };

interface FormDisciplina {
  codigo: string;
  nome: string;
  cargaHoraria: string;
  periodo: string;
  professorId: string;
  status: string;
}

const FORM_VAZIO: FormDisciplina = { codigo: '', nome: '', cargaHoraria: '60', periodo: '1', professorId: '', status: 'Ativa' };

function validar(form: FormDisciplina): Record<string, string> {
  const erros: Record<string, string> = {};
  if (form.codigo.trim().length < 3) erros.codigo = 'Informe o código (mín. 3 caracteres)';
  if (form.nome.trim().length < 3) erros.nome = 'Informe o nome da disciplina';
  const carga = Number(form.cargaHoraria);
  if (!Number.isInteger(carga) || carga < 15 || carga > 400) erros.cargaHoraria = 'Carga horária deve estar entre 15 e 400';
  const periodo = Number(form.periodo);
  if (!Number.isInteger(periodo) || periodo < 1 || periodo > 10) erros.periodo = 'Período deve estar entre 1 e 10';
  if (!form.professorId) erros.professorId = 'Selecione o professor';
  return erros;
}

function DisciplinaFormModal({ disciplina, onFechar, onSalvo }: { disciplina: Disciplina | null; onFechar: () => void; onSalvo: () => void }) {
  const opcoes = useOpcoes();
  const toast = useToast();
  const [form, setForm] = useState<FormDisciplina>(
    disciplina
      ? {
          codigo: disciplina.codigo,
          nome: disciplina.nome,
          cargaHoraria: String(disciplina.cargaHoraria),
          periodo: String(disciplina.periodo),
          professorId: String(disciplina.professorId),
          status: disciplina.status
        }
      : FORM_VAZIO
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo: keyof FormDisciplina, valor: string) => {
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
    const corpo = {
      ...form,
      cargaHoraria: Number(form.cargaHoraria),
      periodo: Number(form.periodo),
      professorId: Number(form.professorId)
    };
    try {
      if (disciplina) await api.put(`/api/disciplinas/${disciplina.id}`, corpo);
      else await api.post('/api/disciplinas', corpo);
      invalidarOpcoes();
      toast.success(disciplina ? 'Disciplina atualizada com sucesso.' : 'Disciplina cadastrada com sucesso.');
      onSalvo();
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) setErros(falha.campos);
      else toast.error(falha instanceof ApiError ? falha.message : 'Erro ao salvar a disciplina.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto
      titulo={disciplina ? 'Editar disciplina' : 'Nova disciplina'}
      onFechar={onFechar}
      rodape={
        <>
          <Button variante="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-disciplina" carregando={salvando} icone="check">
            Salvar
          </Button>
        </>
      }
    >
      <form id="form-disciplina" onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field rotulo="Código" erro={erros.codigo}>
          <Input value={form.codigo} onChange={(e) => alterar('codigo', e.target.value)} invalido={!!erros.codigo} placeholder="CMP301" autoFocus />
        </Field>
        <Field rotulo="Nome" erro={erros.nome}>
          <Input value={form.nome} onChange={(e) => alterar('nome', e.target.value)} invalido={!!erros.nome} />
        </Field>
        <Field rotulo="Carga horária (h)" erro={erros.cargaHoraria}>
          <Input type="number" min={15} max={400} value={form.cargaHoraria} onChange={(e) => alterar('cargaHoraria', e.target.value)} invalido={!!erros.cargaHoraria} />
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
        <Field rotulo="Professor" erro={erros.professorId}>
          <Select value={form.professorId} onChange={(e) => alterar('professorId', e.target.value)} invalido={!!erros.professorId}>
            <option value="">Selecione...</option>
            {opcoes?.professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field rotulo="Status">
          <Select value={form.status} onChange={(e) => alterar('status', e.target.value)}>
            {(opcoes?.statusDisciplina ?? ['Ativa', 'Inativa']).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

export function DisciplinasPage() {
  const opcoes = useOpcoes();
  const toast = useToast();
  const lista = useListagem<DisciplinaListada>('/api/disciplinas', FILTROS_INICIAIS);
  const [edicao, setEdicao] = useState<{ disciplina: Disciplina | null } | null>(null);
  const [exclusao, setExclusao] = useState<DisciplinaListada | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const confirmarExclusao = async () => {
    if (!exclusao) return;
    setExcluindo(true);
    try {
      const resultado = await api.delete<{ notasRemovidas: number }>(`/api/disciplinas/${exclusao.id}`);
      invalidarOpcoes();
      toast.success(`Disciplina excluída (${resultado.notasRemovidas} lançamento(s) de nota removido(s)).`);
      setExclusao(null);
      lista.reload();
    } catch (falha) {
      toast.error(falha instanceof ApiError ? falha.message : 'Erro ao excluir a disciplina.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Disciplinas"
        subtitulo="Grade curricular e professores responsáveis"
        acoes={
          <Button icone="plus" onClick={() => setEdicao({ disciplina: null })}>
            Nova disciplina
          </Button>
        }
      />

      <Card semPadding>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <SearchInput valor={lista.filtros.busca} onChange={(v) => lista.definirFiltro('busca', v)} placeholder="Pesquisar por código ou nome..." />
          </div>
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
            {opcoes?.statusDisciplina.map((s) => (
              <option key={s}>{s}</option>
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
        <DataTable<DisciplinaListada>
          itens={lista.data?.itens}
          carregando={lista.loading}
          erro={lista.error}
          onRetry={lista.reload}
          chaveDe={(d) => d.id}
          ordenacao={lista.ordenacao}
          onOrdenar={lista.alternarOrdenacao}
          vazioTitulo="Nenhuma disciplina encontrada"
          colunas={[
            { chave: 'codigo', titulo: 'Código', ordenavel: true, render: (d) => <span className="font-mono text-xs font-medium">{d.codigo}</span> },
            { chave: 'nome', titulo: 'Nome', ordenavel: true, render: (d) => <span className="font-medium text-slate-900">{d.nome}</span> },
            { chave: 'cargaHoraria', titulo: 'Carga horária', ordenavel: true, alinhamento: 'right', render: (d) => `${d.cargaHoraria} h` },
            { chave: 'periodo', titulo: 'Período', ordenavel: true, alinhamento: 'center', render: (d) => `${d.periodo}º` },
            { chave: 'professorNome', titulo: 'Professor', ordenavel: true, render: (d) => d.professorNome },
            { chave: 'status', titulo: 'Status', ordenavel: true, render: (d) => <Badge>{d.status}</Badge> },
            {
              chave: 'acoes',
              titulo: 'Ações',
              alinhamento: 'right',
              render: (d) => (
                <div className="flex justify-end gap-1">
                  <IconButton icone="pencil" titulo="Editar" tom="brand" onClick={() => setEdicao({ disciplina: d })} />
                  <IconButton icone="trash" titulo="Excluir" tom="rose" onClick={() => setExclusao(d)} />
                </div>
              )
            }
          ]}
        />
        <Paginacao pagina={lista.data} onMudar={lista.irParaPagina} />
      </Card>

      {edicao && (
        <DisciplinaFormModal
          disciplina={edicao.disciplina}
          onFechar={() => setEdicao(null)}
          onSalvo={() => {
            setEdicao(null);
            lista.reload();
          }}
        />
      )}
      <ConfirmDialog
        aberto={exclusao !== null}
        titulo="Excluir disciplina"
        carregando={excluindo}
        onCancelar={() => setExclusao(null)}
        onConfirmar={confirmarExclusao}
        mensagem={
          <>
            Deseja realmente excluir <strong>{exclusao?.codigo} · {exclusao?.nome}</strong>? Os lançamentos de notas desta disciplina também serão removidos. Esta ação não pode ser desfeita.
          </>
        }
      />
    </div>
  );
}
