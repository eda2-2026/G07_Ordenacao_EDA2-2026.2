import { SortContext } from './context';

export function bubbleSort<T>(data: T[], ctx: SortContext<T>): T[] {
  const n = data.length;
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - pass; j++) {
      if (ctx.compare(data[j], data[j + 1], j, j + 1) > 0) {
        ctx.swap(data, j, j + 1);
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return data;
}
