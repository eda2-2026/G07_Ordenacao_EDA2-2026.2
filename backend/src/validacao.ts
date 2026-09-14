import { ErroValidacao } from './erros';

export type Corpo = Record<string, unknown>;

export class Validador {
  readonly erros: Record<string, string> = {};

  constructor(private readonly corpo: Corpo) {}

  texto(campo: string, rotulo: string, minimo = 1, maximo = 120): string {
    const valor = this.corpo[campo];
    const texto = typeof valor === 'string' ? valor.trim() : '';
    if (texto.length < minimo) {
      this.erros[campo] = texto.length === 0 ? `${rotulo} é obrigatório` : `${rotulo} deve ter ao menos ${minimo} caracteres`;
    } else if (texto.length > maximo) {
      this.erros[campo] = `${rotulo} deve ter no máximo ${maximo} caracteres`;
    }
    return texto;
  }

  email(campo: string, rotulo = 'E-mail'): string {
    const texto = this.texto(campo, rotulo, 1, 120);
    if (!this.erros[campo] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) {
      this.erros[campo] = `${rotulo} inválido`;
    }
    return texto;
  }

  inteiro(campo: string, rotulo: string, minimo: number, maximo: number): number {
    const bruto = this.corpo[campo];
    const numero = typeof bruto === 'number' ? bruto : typeof bruto === 'string' && bruto.trim() !== '' ? Number(bruto) : NaN;
    if (!Number.isInteger(numero)) {
      this.erros[campo] = `${rotulo} deve ser um número inteiro`;
      return 0;
    }
    if (numero < minimo || numero > maximo) {
      this.erros[campo] = `${rotulo} deve estar entre ${minimo} e ${maximo}`;
    }
    return numero;
  }

  decimal(campo: string, rotulo: string, minimo: number, maximo: number): number {
    const bruto = this.corpo[campo];
    const numero = typeof bruto === 'number' ? bruto : typeof bruto === 'string' && bruto.trim() !== '' ? Number(bruto.replace(',', '.')) : NaN;
    if (!Number.isFinite(numero)) {
      this.erros[campo] = `${rotulo} deve ser um número`;
      return 0;
    }
    if (numero < minimo || numero > maximo) {
      this.erros[campo] = `${rotulo} deve estar entre ${minimo} e ${maximo}`;
    }
    return numero;
  }

  opcao<T extends string>(campo: string, rotulo: string, permitidas: readonly T[]): T {
    const valor = this.corpo[campo];
    if (typeof valor !== 'string' || !(permitidas as readonly string[]).includes(valor)) {
      this.erros[campo] = `${rotulo} inválido`;
      return permitidas[0];
    }
    return valor as T;
  }

  erro(campo: string, mensagem: string): void {
    this.erros[campo] = mensagem;
  }

  validar(): void {
    if (Object.keys(this.erros).length > 0) throw new ErroValidacao(this.erros);
  }
}

export function corpoDe(valor: unknown): Corpo {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Corpo) : {};
}
