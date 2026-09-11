import { SortContext } from './context';

export function selectionSort<T>(data: T[], ctx: SortContext<T>): T[] {
  const n = data.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      if (ctx.compare(data[j], data[min], j, min) < 0) {
        min = j;
      }
    }
    ctx.swap(data, i, min);
  }
  return data;
}
