export const COR_PRIMARIA = '#6366f1';

export const CORES_SITUACAO: Record<string, string> = {
  Aprovado: '#10b981',
  Recuperação: '#f59e0b',
  Reprovado: '#f43f5e',
  'Reprovado por Frequência': '#fb923c'
};

export const CORES_ALGORITMO: Record<string, string> = {
  bubble: '#f43f5e',
  selection: '#f59e0b',
  insertion: '#10b981',
  merge: '#6366f1',
  quick: '#0ea5e9'
};

export const CORES_CENARIO: Record<string, string> = {
  aleatorio: '#6366f1',
  ordenado: '#10b981',
  inverso: '#f43f5e'
};

export const GRADE = { stroke: '#e2e8f0', strokeDasharray: '3 3' };

export const EIXO = { tick: { fill: '#64748b', fontSize: 12 }, axisLine: { stroke: '#cbd5e1' }, tickLine: false };

export const TOOLTIP = {
  contentStyle: { borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(15,23,42,0.08)', fontSize: 13 },
  cursor: { fill: 'rgba(99,102,241,0.06)' }
};
