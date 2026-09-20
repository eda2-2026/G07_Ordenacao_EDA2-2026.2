import { CORES_ALGORITMO } from '../chartTheme';
import { AlgoritmoInfo } from '../types';

export function TabelaComplexidade({ algoritmos }: { algoritmos: AlgoritmoInfo[] }) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Algoritmo</th>
            <th className="px-4 py-3">Melhor caso</th>
            <th className="px-4 py-3">Caso médio</th>
            <th className="px-4 py-3">Pior caso</th>
            <th className="px-4 py-3">Espaço</th>
            <th className="px-4 py-3">Estável</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {algoritmos.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium text-slate-900">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: CORES_ALGORITMO[a.id] }} />
                {a.name}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.best}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.average}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.worst}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.space}</td>
              <td className="px-4 py-3 text-slate-600">{a.stable ? 'Sim' : 'Não'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
