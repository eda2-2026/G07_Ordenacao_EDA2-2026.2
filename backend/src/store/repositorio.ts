import fs from 'fs';
import path from 'path';
import { Entidade } from '../types';

export function serializar<T>(itens: readonly T[]): string {
  if (itens.length === 0) return '[]\n';
  return '[\n' + itens.map((item) => '  ' + JSON.stringify(item)).join(',\n') + '\n]\n';
}

export class Repositorio<T extends Entidade> {
  private itens: T[] = [];
  private indice = new Map<number, T>();
  private proximoId = 1;
  private readonly arquivo: string;

  constructor(dir: string, nomeArquivo: string) {
    this.arquivo = path.join(dir, nomeArquivo);
    this.carregar();
  }

  private carregar(): void {
    if (fs.existsSync(this.arquivo)) {
      const conteudo = fs.readFileSync(this.arquivo, 'utf-8');
      this.itens = conteudo.trim() ? (JSON.parse(conteudo) as T[]) : [];
    } else {
      this.itens = [];
    }
    this.reindexar();
  }

  private reindexar(): void {
    this.indice = new Map();
    let maior = 0;
    for (const item of this.itens) {
      this.indice.set(item.id, item);
      if (item.id > maior) maior = item.id;
    }
    this.proximoId = Math.max(this.proximoId, maior + 1);
  }

  private persistir(): void {
    fs.mkdirSync(path.dirname(this.arquivo), { recursive: true });
    fs.writeFileSync(this.arquivo, serializar(this.itens), 'utf-8');
  }

  todos(): readonly T[] {
    return this.itens;
  }

  total(): number {
    return this.itens.length;
  }

  buscar(id: number): T | undefined {
    return this.indice.get(id);
  }

  existe(id: number): boolean {
    return this.indice.has(id);
  }

  criar(dados: Omit<T, 'id'>): T {
    const item = { ...dados, id: this.proximoId++ } as T;
    this.itens.push(item);
    this.indice.set(item.id, item);
    this.persistir();
    return item;
  }

  atualizar(id: number, dados: Partial<Omit<T, 'id'>>): T | undefined {
    const atual = this.indice.get(id);
    if (!atual) return undefined;
    Object.assign(atual, dados);
    this.persistir();
    return atual;
  }

  remover(id: number): boolean {
    return this.removerVarios((item) => item.id === id) > 0;
  }

  removerVarios(predicado: (item: T) => boolean): number {
    const antes = this.itens.length;
    this.itens = this.itens.filter((item) => !predicado(item));
    const removidos = antes - this.itens.length;
    if (removidos > 0) {
      this.reindexar();
      this.persistir();
    }
    return removidos;
  }
}
