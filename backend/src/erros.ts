export class ErroHttp extends Error {
  constructor(
    readonly status: number,
    mensagem: string
  ) {
    super(mensagem);
  }
}

export class ErroValidacao extends Error {
  constructor(readonly campos: Record<string, string>) {
    super('Dados inválidos');
  }
}
