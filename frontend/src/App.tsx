import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { AlertasPage } from './pages/AlertasPage';
import { AlunosPage } from './pages/AlunosPage';
import { ApresentacaoPage } from './pages/ApresentacaoPage';
import { DashboardPage } from './pages/DashboardPage';
import { DisciplinasPage } from './pages/DisciplinasPage';
import { EstatisticasPage } from './pages/EstatisticasPage';
import { LoginPage } from './pages/LoginPage';
import { NotasPage } from './pages/NotasPage';
import { OrdenacaoPage } from './pages/OrdenacaoPage';
import { ProfessoresPage } from './pages/ProfessoresPage';
import { RankingPage } from './pages/RankingPage';
import { RelatoriosPage } from './pages/RelatoriosPage';

function Protegido() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Layout />;
}

export function App() {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<Protegido />}>
        <Route index element={<DashboardPage />} />
        <Route path="alunos" element={<AlunosPage />} />
        <Route path="professores" element={<ProfessoresPage />} />
        <Route path="disciplinas" element={<DisciplinasPage />} />
        <Route path="notas" element={<NotasPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="estatisticas" element={<EstatisticasPage />} />
        <Route path="alertas" element={<AlertasPage />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        <Route path="ordenacao" element={<OrdenacaoPage />} />
        <Route path="apresentacao" element={<ApresentacaoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
