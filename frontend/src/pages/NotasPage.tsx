import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, ApiError, qs } from '../api/client';
import { DataTable, Paginacao } from '../components/DataTable';
import { Icon } from '../components/Icon';
import { ConfirmDialog, Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, Field, IconButton, Input, PageHeader, SearchInput, Select } from '../components/ui';
import { formatarFrequencia, formatarNota } from '../format';
import { useDebounce } from '../hooks/useDebounce';
import { useListagem } from '../hooks/useListagem';
import { useOpcoes } from '../hooks/useOpcoes';
import { calcularMedia, determinarStatus } from '../rules';
import { AlunoListado, NotaListada, Pagina } from '../types';

const FILTROS_INICIAIS = { busca: '', curso: '', disciplinaId: '', professorId: '', status: '' };

interface AlunoSelecionado {
  id: number;
  nome: string;
  matricula: string;
}

function AlunoPicker({
  selecionado,
  onSelecionar,
  erro
}: {
  selecionado: AlunoSelecionado | null;
  onSelecionar: (aluno: AlunoSelecionado | null) => void;
  erro?: string;
}) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<AlunoListado[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const termo = useDebounce(busca, 300);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto || termo.trim().length < 2) {
      setResultados([]);
      return;
    }
    let ativo = true;
    setCarregando(true);
    api
      .get<Pagina<AlunoListado>>(`/api/alunos${qs({ busca: termo, limite: 8 })}`)
      .then((pagina) => {
        if (ativo) setResultados(pagina.itens);
      })
      .catch(() => {
        if (ativo) setResultados([]);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [termo, aberto]);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (container.current && !container.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  if (selecionado) {
    return (
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Aluno</span>
        <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
          <span>
            <strong className="font-medium text-slate-900">{selecionado.nome}</strong>
            <span className="ml-2 font-mono text-xs text-slate-500">{selecionado.matricula}</span>
          </span>
          <button type="button" onClick={() => onSelecionar(null)} className="text-xs font-medium text-brand-600 hover:underline">
            Trocar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={container} className="relative">
      <Field rotulo="Aluno" erro={erro} dica="Digite ao menos 2 letras do nome ou da matrícula">
        <Input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          invalido={!!erro}
          placeholder="Buscar aluno..."
          autoComplete="off"
        />
      </Field>
      {aberto && termo.trim().length >= 2 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {carregando && <li className="px-3 py-2 text-sm text-slate-500">Buscando...</li>}
          {!carregando && resultados.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Nenhum aluno encontrado</li>}
          {resultados.map((aluno) => (
            <li key={aluno.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50"
                onClick={() => {
                  onSelecionar({ id: aluno.id, nome: aluno.nome, matricula: aluno.matricula });
                  setAberto(false);
                  setBusca('');
                }}
              >
                <span className="font-medium text-slate-800">{aluno.nome}</span>
                <span className="font-mono text-xs text-slate-500">{aluno.matricula}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FormNota {
  disciplinaId: string;
  professorId: string;
  nota1: string;
  nota2: string;
  nota3: string;
  frequencia: string;
}

function paraNumero(texto: string): number {
  return texto.trim() === '' ? NaN : Number(texto.replace(',', '.'));
}

function validar(form: FormNota, aluno: AlunoSelecionado | null): Record<string, string> {
  const erros: Record<string, string> = {};
  if (!aluno) erros.alunoId = 'Selecione o aluno';
  if (!form.disciplinaId) erros.disciplinaId = 'Selecione a disciplina';
  if (!form.professorId) erros.professorId = 'Selecione o professor';
  for (const campo of ['nota1', 'nota2', 'nota3'] as const) {
    const valor = paraNumero(form[campo]);
    if (!Number.isFinite(valor) || valor < 0 || valor > 10) erros[campo] = 'Informe de 0 a 10';
  }
  const frequencia = paraNumero(form.frequencia);
  if (!Number.isFinite(frequencia) || frequencia < 0 || frequencia > 100) erros.frequencia = 'Informe de 0 a 100';
  return erros;
}

function NotaFormModal({ nota, onFechar, onSalvo }: { nota: NotaListada | null; onFechar: () => void; onSalvo: () => void }) {
  const opcoes = useOpcoes();
  const toast = useToast();
  const [aluno, setAluno] = useState<AlunoSelecionado | null>(nota ? { id: nota.alunoId, nome: nota.alunoNome, matricula: nota.alunoMatricula } : null);
  const [form, setForm] = useState<FormNota>(
    nota
      ? {
          disciplinaId: String(nota.disciplinaId),
          professorId: String(nota.professorId),
          nota1: String(nota.nota1),
          nota2: String(nota.nota2),
          nota3: String(nota.nota3),
          frequencia: String(nota.frequencia)
        }
      : { disciplinaId: '', professorId: '', nota1: '', nota2: '', nota3: '', frequencia: '' }
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo: keyof FormNota, valor: string) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: '' }));
  };

  const escolherDisciplina = (valor: string) => {
    const disciplina = opcoes?.disciplinas.find((d) => String(d.id) === valor);
    setForm((atual) => ({ ...atual, disciplinaId: valor, professorId: disciplina ? String(disciplina.professorId) : atual.professorId }));
    setErros((atual) => ({ ...atual, disciplinaId: '', professorId: '' }));
  };

  const n1 = paraNumero(form.nota1);
  const n2 = paraNumero(form.nota2);
  const n3 = paraNumero(form.nota3);
  const freq = paraNumero(form.frequencia);
  const previaValida = [n1, n2, n3, freq].every(Number.isFinite);
  const media = previaValida ? calcularMedia(n1, n2, n3) : null;
  const situacao = media !== null ? determinarStatus(media, freq) : null;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const encontrados = validar(form, aluno);
    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados);
      return;
    }
    setSalvando(true);
    const corpo = {
      alunoId: aluno?.id,
      disciplinaId: Number(form.disciplinaId),
      professorId: Number(form.professorId),
      nota1: paraNumero(form.nota1),
      nota2: paraNumero(form.nota2),
      nota3: paraNumero(form.nota3),
      frequencia: paraNumero(form.frequencia)
    };
    try {
      if (nota) await api.put(`/api/notas/${nota.id}`, corpo);
      else await api.post('/api/notas', corpo);
      toast.success(nota ? 'Notas atualizadas com sucesso.' : 'Notas lançadas com sucesso.');
      onSalvo();
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) setErros(falha.campos);
      else toast.error(falha instanceof ApiError ? falha.message : 'Erro ao salvar as notas.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto
      titulo={nota ? 'Editar lançamento de notas' : 'Lançar notas'}
      onFechar={onFechar}
      rodape={
        <>
          <Button variante="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-nota" carregando={salvando} icone="check">
            Salvar
          </Button>
        </>
      }
    >
      <form id="form-nota" onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AlunoPicker selecionado={aluno} onSelecionar={(a) => { setAluno(a); setErros((atual) => ({ ...atual, alunoId: '' })); }} erro={erros.alunoId} />
        </div>
        <Field rotulo="Disciplina" erro={erros.disciplinaId}>
          <Select value={form.disciplinaId} onChange={(e) => escolherDisciplina(e.target.value)} invalido={!!erros.disciplinaId}>
            <option value="">Selecione...</option>
            {opcoes?.disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} · {d.nome}
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
        <Field rotulo="Nota 1" erro={erros.nota1}>
          <Input type="number" step="0.1" min={0} max={10} value={form.nota1} onChange={(e) => alterar('nota1', e.target.value)} invalido={!!erros.nota1} />
        </Field>
        <Field rotulo="Nota 2" erro={erros.nota2}>
          <Input type="number" step="0.1" min={0} max={10} value={form.nota2} onChange={(e) => alterar('nota2', e.target.value)} invalido={!!erros.nota2} />
        </Field>
        <Field rotulo="Nota 3" erro={erros.nota3}>
          <Input type="number" step="0.1" min={0} max={10} value={form.nota3} onChange={(e) => alterar('nota3', e.target.value)} invalido={!!erros.nota3} />
        </Field>
        <Field rotulo="Frequência (%)" erro={erros.frequencia}>
          <Input type="number" step="0.1" min={0} max={100} value={form.frequencia} onChange={(e) => alterar('frequencia', e.target.value)} invalido={!!erros.frequencia} />
        </Field>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Média calculada</p>
            <p className="text-2xl font-bold text-slate-900">{formatarNota(media)}</p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Situação</p>
            {situacao ? <Badge>{situacao}</Badge> : <span className="text-sm text-slate-400">Preencha as notas</span>}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function NotasPage() {
  const opcoes = useOpcoes();
  const toast = useToast();
  const lista = useListagem<NotaListada>('/api/notas', FILTROS_INICIAIS);
  const [edicao, setEdicao] = useState<{ nota: NotaListada | null } | null>(null);
  const [exclusao, setExclusao] = useState<NotaListada | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const confirmarExclusao = async () => {
    if (!exclusao) return;
    setExcluindo(true);
    try {
      await api.delete(`/api/notas/${exclusao.id}`);
      toast.success('Lançamento excluído com sucesso.');
      setExclusao(null);
      lista.reload();
    } catch (falha) {
      toast.error(falha instanceof ApiError ? falha.message : 'Erro ao excluir o lançamento.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Notas"
        subtitulo="Lançamento de notas, frequência e situação acadêmica"
        acoes={
          <Button icone="plus" onClick={() => setEdicao({ nota: null })}>
            Lançar notas
          </Button>
        }
      />
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Média = (nota 1 + nota 2 + nota 3) / 3. Aprovado com média ≥ 7,0; recuperação entre 5,0 e 6,99; reprovado abaixo de 5,0. Frequência inferior a 75% resulta em reprovação por frequência.
        </p>
      </div>

      <Card semPadding>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <SearchInput valor={lista.filtros.busca} onChange={(v) => lista.definirFiltro('busca', v)} placeholder="Aluno (nome ou matrícula)..." />
          </div>
          <Select aria-label="Curso" value={lista.filtros.curso} onChange={(e) => lista.definirFiltro('curso', e.target.value)}>
            <option value="">Todos os cursos</option>
            {opcoes?.cursos.map((c) => (
              <option key={c}>{c}</option>
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
          <Select aria-label="Situação" value={lista.filtros.status} onChange={(e) => lista.definirFiltro('status', e.target.value)}>
            <option value="">Todas as situações</option>
            {opcoes?.statusNota.map((s) => (
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
        <DataTable<NotaListada>
          itens={lista.data?.itens}
          carregando={lista.loading}
          erro={lista.error}
          onRetry={lista.reload}
          chaveDe={(n) => n.id}
          ordenacao={lista.ordenacao}
          onOrdenar={lista.alternarOrdenacao}
          vazioTitulo="Nenhum lançamento encontrado"
          colunas={[
            {
              chave: 'alunoNome',
              titulo: 'Aluno',
              ordenavel: true,
              render: (n) => (
                <div>
                  <p className="font-medium text-slate-900">{n.alunoNome}</p>
                  <p className="font-mono text-xs text-slate-400">{n.alunoMatricula}</p>
                </div>
              )
            },
            {
              chave: 'disciplinaCodigo',
              titulo: 'Disciplina',
              ordenavel: true,
              render: (n) => (
                <div>
                  <p className="font-mono text-xs font-medium">{n.disciplinaCodigo}</p>
                  <p className="text-xs text-slate-400">{n.disciplinaNome}</p>
                </div>
              )
            },
            { chave: 'professorNome', titulo: 'Professor', ordenavel: true, render: (n) => n.professorNome },
            { chave: 'n1', titulo: 'N1', alinhamento: 'right', render: (n) => formatarNota(n.nota1) },
            { chave: 'n2', titulo: 'N2', alinhamento: 'right', render: (n) => formatarNota(n.nota2) },
            { chave: 'n3', titulo: 'N3', alinhamento: 'right', render: (n) => formatarNota(n.nota3) },
            { chave: 'media', titulo: 'Média', ordenavel: true, alinhamento: 'right', render: (n) => <strong>{formatarNota(n.media)}</strong> },
            { chave: 'frequencia', titulo: 'Freq.', ordenavel: true, alinhamento: 'right', render: (n) => formatarFrequencia(n.frequencia) },
            { chave: 'status', titulo: 'Situação', ordenavel: true, render: (n) => <Badge>{n.status}</Badge> },
            {
              chave: 'acoes',
              titulo: 'Ações',
              alinhamento: 'right',
              render: (n) => (
                <div className="flex justify-end gap-1">
                  <IconButton icone="pencil" titulo="Editar" tom="brand" onClick={() => setEdicao({ nota: n })} />
                  <IconButton icone="trash" titulo="Excluir" tom="rose" onClick={() => setExclusao(n)} />
                </div>
              )
            }
          ]}
        />
        <Paginacao pagina={lista.data} onMudar={lista.irParaPagina} />
      </Card>

      {edicao && (
        <NotaFormModal
          nota={edicao.nota}
          onFechar={() => setEdicao(null)}
          onSalvo={() => {
            setEdicao(null);
            lista.reload();
          }}
        />
      )}
      <ConfirmDialog
        aberto={exclusao !== null}
        titulo="Excluir lançamento"
        carregando={excluindo}
        onCancelar={() => setExclusao(null)}
        onConfirmar={confirmarExclusao}
        mensagem={
          <>
            Deseja realmente excluir o lançamento de <strong>{exclusao?.alunoNome}</strong> em <strong>{exclusao?.disciplinaCodigo}</strong>? Esta ação não pode ser desfeita.
          </>
        }
      />
    </div>
  );
}
