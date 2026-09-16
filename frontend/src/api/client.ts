export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly campos?: Record<string, string>
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | boolean | undefined | null>;

export function qs(params: Params): string {
  const partes: string[] = [];
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue;
    partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(String(valor))}`);
  }
  return partes.length ? `?${partes.join('&')}` : '';
}

async function requisitar<T>(metodo: string, url: string, corpo?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o servidor está em execução.');
  }
  let json: unknown = null;
  try {
    json = await resposta.json();
  } catch {
    json = null;
  }
  if (!resposta.ok) {
    const dados = (json ?? {}) as { erro?: string; campos?: Record<string, string> };
    throw new ApiError(resposta.status, dados.erro ?? `Erro ${resposta.status}`, dados.campos);
  }
  return json as T;
}

export const api = {
  get: <T>(url: string) => requisitar<T>('GET', url),
  post: <T>(url: string, corpo?: unknown) => requisitar<T>('POST', url, corpo ?? {}),
  put: <T>(url: string, corpo: unknown) => requisitar<T>('PUT', url, corpo),
  delete: <T>(url: string) => requisitar<T>('DELETE', url)
};
