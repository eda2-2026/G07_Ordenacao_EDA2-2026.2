import { SortContext } from './context';

function merge<T>(data: T[], aux: T[], low: number, mid: number, high: number, ctx: SortContext<T>): void {
  for (let k = low; k <= high; k++) {
    aux[k] = data[k];
  }
  let left = low;
  let right = mid + 1;
  for (let k = low; k <= high; k++) {
    if (left > mid) {
      ctx.move(data, k, aux[right++]);
    } else if (right > high) {
      ctx.move(data, k, aux[left++]);
    } else if (ctx.compare(aux[right], aux[left], right, left) < 0) {
      ctx.move(data, k, aux[right++]);
    } else {
      ctx.move(data, k, aux[left++]);
    }
  }
}

function divide<T>(data: T[], aux: T[], low: number, high: number, ctx: SortContext<T>): void {
  if (low >= high) return;
  const mid = low + Math.floor((high - low) / 2);
  divide(data, aux, low, mid, ctx);
  divide(data, aux, mid + 1, high, ctx);
  merge(data, aux, low, mid, high, ctx);
}

export function mergeSort<T>(data: T[], ctx: SortContext<T>): T[] {
  const aux = data.slice();
  divide(data, aux, 0, data.length - 1, ctx);
  return data;
}
