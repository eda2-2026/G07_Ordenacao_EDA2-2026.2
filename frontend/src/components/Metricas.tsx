import { formatarInteiro, formatarTempo } from '../format';
import { Metricas } from '../types';

export function MetricasResumo({ metricas, elementos, rotuloElementos = 'elementos' }: { metricas: Metricas; elementos?: number; rotuloElementos?: string }) {
  const itens = [
    { rotulo: 'Algoritmo', valor: metricas.algorithm },
    ...(elementos !== undefined ? [{ rotulo: 'Quantidade', valor: `${formatarInteiro(elementos)} ${rotuloElementos}` }] : []),
    { rotulo: 'Comparações', valor: formatarInteiro(metricas.comparisons) },
    { rotulo: 'Trocas', valor: formatarInteiro(metricas.swaps) },
    { rotulo: 'Movimentações', valor: formatarInteiro(metricas.movements) },
    { rotulo: 'Tempo', valor: formatarTempo(metricas.executionTime) }
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {itens.map((item) => (
        <div key={item.rotulo} className="rounded-lg bg-white/70 px-3 py-2 ring-1 ring-brand-200">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-700/70">{item.rotulo}</dt>
          <dd className="truncate text-sm font-semibold text-slate-900">{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
