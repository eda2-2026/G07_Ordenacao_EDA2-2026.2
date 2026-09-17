import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icon, IconName } from './Icon';

interface ItemMenu {
  para: string;
  rotulo: string;
  icone: IconName;
}

interface GrupoMenu {
  titulo: string;
  itens: ItemMenu[];
}

const MENU: GrupoMenu[] = [
  {
    titulo: 'Visão geral',
    itens: [
      { para: '/', rotulo: 'Dashboard', icone: 'home' },
      { para: '/ranking', rotulo: 'Ranking', icone: 'trophy' },
      { para: '/estatisticas', rotulo: 'Estatísticas', icone: 'pie' },
      { para: '/alertas', rotulo: 'Alertas', icone: 'alert' },
      { para: '/relatorios', rotulo: 'Relatórios', icone: 'file' }
    ]
  },
  {
    titulo: 'Gestão acadêmica',
    itens: [
      { para: '/alunos', rotulo: 'Alunos', icone: 'users' },
      { para: '/professores', rotulo: 'Professores', icone: 'teacher' },
      { para: '/disciplinas', rotulo: 'Disciplinas', icone: 'book' },
      { para: '/notas', rotulo: 'Notas', icone: 'pencil' }
    ]
  },
  {
    titulo: 'Algoritmos',
    itens: [
      { para: '/ordenacao', rotulo: 'Laboratório de Ordenação', icone: 'flask' },
      { para: '/apresentacao', rotulo: 'Modo Apresentação', icone: 'monitor' }
    ]
  }
];

const TITULOS: Record<string, string> = {
  '/': 'Dashboard',
  '/ranking': 'Ranking',
  '/estatisticas': 'Estatísticas',
  '/alertas': 'Alertas',
  '/relatorios': 'Relatórios',
  '/alunos': 'Alunos',
  '/professores': 'Professores',
  '/disciplinas': 'Disciplinas',
  '/notas': 'Notas',
  '/ordenacao': 'Laboratório de Ordenação',
  '/apresentacao': 'Modo Apresentação'
};

const PERFIS = { admin: 'Administrador', professor: 'Professor', coordenador: 'Coordenador' };

function Menu({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Menu principal">
      {MENU.map((grupo) => (
        <div key={grupo.titulo}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{grupo.titulo}</p>
          <ul className="space-y-1">
            {grupo.itens.map((item) => (
              <li key={item.para}>
                <NavLink
                  to={item.para}
                  end={item.para === '/'}
                  onClick={aoNavegar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-brand-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon name={item.icone} className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.rotulo}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Icon name="chart" className="h-6 w-6" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-white">Ranking Acadêmico</p>
        <p className="text-xs text-slate-400">EDA2 · Ordenação</p>
      </div>
    </div>
  );
}

export function Layout() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const titulo = TITULOS[local.pathname] ?? 'Sistema de Ranking e Gestão Acadêmica';

  useEffect(() => {
    setMenuAberto(false);
    window.scrollTo({ top: 0 });
  }, [local.pathname]);

  const aoSair = () => {
    sair();
    navegar('/login', { replace: true });
  };

  return (
    <div className="flex min-h-full bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 lg:flex">
        <Marca />
        <Menu />
        <div className="border-t border-slate-800 p-4 text-xs text-slate-500">Dados fictícios · uso acadêmico</div>
      </aside>

      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMenuAberto(false)} />
          <aside className="animate-slide-in absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-900">
            <Marca />
            <Menu aoNavegar={() => setMenuAberto(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
            >
              <Icon name="menu" />
            </button>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Sistema de Ranking e Gestão Acadêmica</p>
              <p className="text-sm font-semibold text-slate-800">{titulo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{usuario?.nome}</p>
              <p className="text-xs text-slate-500">{usuario ? PERFIS[usuario.perfil] : ''}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {usuario?.nome.charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={aoSair}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Icon name="logout" className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>
        <main className="animate-fade-in flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
