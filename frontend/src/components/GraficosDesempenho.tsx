import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CORES_ALGORITMO, CORES_CENARIO, EIXO, GRADE, TOOLTIP } from '../chartTheme';
import { formatarInteiro, formatarTempo } from '../format';
import { AlgoritmoInfo, Cenario, ResultadoAlgoritmo, ResultadoExecucao } from '../types';

export type MetricaGrafico = 'executionTime' | 'comparisons' | 'swaps' | 'movements';

export const ROTULOS_METRICA: Record<MetricaGrafico, string> = {
  executionTime: 'Tempo de execução (ms)',
  comparisons: 'Comparações',
  swaps: 'Trocas',
  movements: 'Movimentações'
};

const ROTULOS_CENARIO: Record<Cenario, string> = { aleatorio: 'Aleatório', ordenado: 'Ordenado', inverso: 'Inversamente ordenado' };

export function nomeCenario(cenario: Cenario): string {
  return ROTULOS_CENARIO[cenario];
}

function formatar(metrica: MetricaGrafico, valor: number): string {
  return metrica === 'executionTime' ? formatarTempo(valor) : formatarInteiro(valor);
}

function limiteInferior(metrica: MetricaGrafico): number {
  return metrica === 'executionTime' ? 0.001 : 1;
}

export function GraficoMetrica({
  metrica,
  resultados,
  algoritmos,
  logaritmica
}: {
  metrica: MetricaGrafico;
  resultados: ResultadoAlgoritmo[];
  algoritmos: AlgoritmoInfo[];
  logaritmica: boolean;
}) {
  const minimo = limiteInferior(metrica);
  const dados = resultados.map((r) => ({
    id: r.id,
    nome: algoritmos.find((a) => a.id === r.id)?.name.replace(' Sort', '') ?? r.algorithm,
    real: r[metrica],
    plotado: logaritmica ? Math.max(r[metrica], minimo) : r[metrica]
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid {...GRADE} />
          <XAxis dataKey="nome" {...EIXO} />
          <YAxis
            {...EIXO}
            width={64}
            scale={logaritmica ? 'log' : 'auto'}
            domain={logaritmica ? [minimo, 'auto'] : [0, 'auto']}
            allowDataOverflow={logaritmica}
            tickFormatter={(v) => (metrica === 'executionTime' ? String(Number(v.toPrecision(3))) : formatarInteiro(Number(v)))}
          />
          <Tooltip
            {...TOOLTIP}
            formatter={(_valor, _nome, item) => [formatar(metrica, (item.payload as { real: number }).real), ROTULOS_METRICA[metrica]]}
          />
          <Bar dataKey="plotado" radius={[6, 6, 0, 0]}>
            {dados.map((d) => (
              <Cell key={d.id} fill={CORES_ALGORITMO[d.id]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoCenarios({
  metrica,
  comparacao,
  algoritmos,
  logaritmica
}: {
  metrica: MetricaGrafico;
  comparacao: Record<Cenario, ResultadoExecucao>;
  algoritmos: AlgoritmoInfo[];
  logaritmica: boolean;
}) {
  const minimo = limiteInferior(metrica);
  const dados = algoritmos
    .filter((a) => comparacao.aleatorio.resultados.some((r) => r.id === a.id))
    .map((algoritmo) => {
      const linha: Record<string, string | number> = { nome: algoritmo.name.replace(' Sort', '') };
      for (const cenario of ['aleatorio', 'ordenado', 'inverso'] as const) {
        const valor = comparacao[cenario].resultados.find((r) => r.id === algoritmo.id)?.[metrica] ?? 0;
        linha[cenario] = logaritmica ? Math.max(valor, minimo) : valor;
        linha[`real_${cenario}`] = valor;
      }
      return linha;
    });
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid {...GRADE} />
          <XAxis dataKey="nome" {...EIXO} />
          <YAxis
            {...EIXO}
            width={64}
            scale={logaritmica ? 'log' : 'auto'}
            domain={logaritmica ? [minimo, 'auto'] : [0, 'auto']}
            allowDataOverflow={logaritmica}
            tickFormatter={(v) => (metrica === 'executionTime' ? String(Number(v.toPrecision(3))) : formatarInteiro(Number(v)))}
          />
          <Tooltip
            {...TOOLTIP}
            formatter={(_valor, nome, item) => [
              formatar(metrica, Number((item.payload as Record<string, number>)[`real_${String(item.dataKey)}`])),
              ROTULOS_CENARIO[String(nome) as Cenario] ?? String(nome)
            ]}
          />
          <Legend formatter={(valor) => <span style={{ color: '#475569' }}>{ROTULOS_CENARIO[valor as Cenario] ?? valor}</span>} iconType="circle" />
          {(['aleatorio', 'ordenado', 'inverso'] as const).map((cenario) => (
            <Bar key={cenario} dataKey={cenario} fill={CORES_CENARIO[cenario]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
