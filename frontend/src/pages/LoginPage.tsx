import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import { Button, Field, Input } from '../components/ui';

const DEMONSTRACAO = [
  { usuario: 'admin', senha: 'admin123', perfil: 'Administrador' },
  { usuario: 'professor', senha: '123456', perfil: 'Professor' },
  { usuario: 'coordenador', senha: '123456', perfil: 'Coordenador' }
];

export function LoginPage() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro('Informe usuário e senha.');
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      await entrar(usuario.trim(), senha);
      navegar('/', { replace: true });
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-5">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-900 p-8 text-white md:col-span-2 md:flex">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Icon name="chart" className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-2xl font-bold leading-tight">Sistema de Ranking e Gestão Acadêmica</h1>
            <p className="mt-2 text-sm text-brand-100">Estruturas de Dados 2 — Algoritmos de Ordenação</p>
          </div>
          <ul className="space-y-2 text-sm text-brand-100">
            <li>• Bubble, Selection e Insertion Sort</li>
            <li>• Merge e Quick Sort</li>
            <li>• Métricas e complexidade em tempo real</li>
          </ul>
        </div>

        <div className="p-8 md:col-span-3">
          <h2 className="text-2xl font-bold text-slate-900">Entrar</h2>
          <p className="mt-1 text-sm text-slate-500">Acesso demonstrativo ao sistema.</p>

          <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
            <Field rotulo="Usuário">
              <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" placeholder="admin" autoFocus />
            </Field>
            <Field rotulo="Senha">
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" placeholder="••••••" />
            </Field>
            {erro && (
              <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <Icon name="alert" className="h-4 w-4 shrink-0" />
                {erro}
              </div>
            )}
            <Button type="submit" className="w-full" carregando={carregando} icone="lock">
              Entrar
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credenciais de demonstração</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {DEMONSTRACAO.map((item) => (
                <button
                  key={item.usuario}
                  type="button"
                  onClick={() => {
                    setUsuario(item.usuario);
                    setSenha(item.senha);
                    setErro(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-brand-500 hover:bg-brand-50"
                >
                  <span className="block font-semibold text-slate-800">{item.usuario}</span>
                  <span className="block text-slate-500">{item.senha}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Autenticação simulada, exclusivamente para fins acadêmicos, sem finalidade de segurança ou produção.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
