# Arquitetura

O sistema é uma aplicação web em duas camadas, executada localmente, sem banco de dados e sem serviços externos.

```text
┌────────────────────────┐   HTTP/JSON (/api)   ┌───────────────────────────┐
│  Frontend              │ ───────────────────▶ │  Backend                  │
│  React + Vite + TS     │                      │  Node.js + Express + TS   │
│  Tailwind + Recharts   │ ◀─────────────────── │                           │
│  porta 5173            │                      │  porta 3001               │
└────────────────────────┘                      └─────────────┬─────────────┘
                                                              │ leitura na inicialização
                                                              │ escrita a cada alteração
                                                       ┌──────▼──────┐
                                                       │  data/*.json │
                                                       └─────────────┘
```

Em desenvolvimento o Vite encaminha (`proxy`) as chamadas `/api` para o backend. Em produção (`npm start`) o próprio Express serve os arquivos estáticos gerados em `frontend/dist`.

## Estrutura de pastas

```text
backend/src/
├── algorithms/        Algoritmos de ordenação e camada genérica sort()
├── store/             Repositório em memória com persistência em JSON
├── services/          Regras de negócio (ranking, estatísticas, relatórios, laboratório, busca)
├── routes/            Endpoints Express (um roteador por recurso)
├── scripts/           Gerador dos dados fictícios
├── rules.ts           Média, situação acadêmica e utilitários
├── validacao.ts       Validação dos corpos das requisições
├── app.ts / server.ts Montagem da aplicação e inicialização

frontend/src/
├── api/               Cliente HTTP
├── auth/              Contexto do login demonstrativo (localStorage)
├── components/        Layout, tabela, paginação, modais, gráficos, toasts
├── hooks/             useFetch, useListagem, useOpcoes, useDebounce
└── pages/             Uma página por rota
```

## Armazenamento e estruturas de dados

Cada arquivo JSON é carregado uma única vez por um `Repositorio<T>` (`backend/src/store/repositorio.ts`), que mantém:

- um **vetor** com os registros, na ordem de inserção, usado para percorrer, filtrar e paginar;
- uma **tabela hash** (`Map<id, registro>`) para localizar um registro por identificador em tempo constante.

Toda criação, atualização ou exclusão altera a memória e regrava o arquivo JSON correspondente. Os identificadores são inteiros crescentes e nunca são reaproveitados.

## Papel dos algoritmos na aplicação

Nenhuma parte do projeto utiliza `Array.prototype.sort`. Toda ordenação passa pela função `sort(dados, algoritmo, comparador)` de `backend/src/algorithms/index.ts`:

| Onde                                   | Algoritmo utilizado                                   |
| -------------------------------------- | ----------------------------------------------------- |
| Ranking                                | O escolhido pelo usuário (padrão: Merge Sort)         |
| Laboratório de ordenação               | Os cinco, sobre cópias independentes dos mesmos dados |
| Modo apresentação                      | O escolhido, com registro passo a passo               |
| Listagens (clique no cabeçalho)        | Merge Sort                                            |
| Mediana e maior/menor nota             | Merge Sort                                            |
| Relatórios e gráficos (médias)         | Merge Sort                                            |
| Alertas                                | Quick Sort                                            |
| Busca binária por matrícula            | Merge Sort (pré-requisito) + busca binária            |

## API REST

| Método | Rota                              | Descrição                                                        |
| ------ | --------------------------------- | ---------------------------------------------------------------- |
| POST   | `/api/login`                      | Login demonstrativo                                              |
| GET    | `/api/opcoes`                     | Cursos, departamentos, status, professores e disciplinas         |
| CRUD   | `/api/alunos`                     | Listagem paginada com busca, filtros e ordenação; detalhes       |
| CRUD   | `/api/professores`                | Idem, com as disciplinas ministradas                             |
| CRUD   | `/api/disciplinas`                | Idem                                                             |
| CRUD   | `/api/notas`                      | Lançamentos; média e situação calculadas no servidor             |
| GET    | `/api/ranking`                    | `criterio`, `ordem`, `algoritmo`, filtros e paginação + métricas |
| GET    | `/api/dashboard`                  | Indicadores e dados dos gráficos                                 |
| GET    | `/api/estatisticas`               | Estatísticas com filtros (curso, período, disciplina, professor) |
| GET    | `/api/alertas`                    | Alunos com média < 5 ou frequência < 75%                         |
| GET    | `/api/relatorios/{desempenho,disciplinas,cursos,ranking}` | Relatórios                       |
| GET    | `/api/ordenacao/info`             | Algoritmos, complexidades, tamanhos, cenários e critérios        |
| POST   | `/api/ordenacao/executar`         | Executa o laboratório e devolve as métricas                      |
| POST   | `/api/ordenacao/visualizar`       | Devolve os quadros da execução (3 a 30 elementos)                |
| GET    | `/api/ordenacao/busca`            | Compara busca sequencial e binária por matrícula                 |

Erros de validação retornam `400` com `{ "erro": "...", "campos": { "campo": "mensagem" } }`. Conflitos (por exemplo, excluir um professor com disciplinas) retornam `409`.

## Login demonstrativo

`POST /api/login` compara usuário e senha com `data/usuarios.json` e devolve os dados do usuário (sem a senha). O frontend guarda o resultado no `localStorage` e protege as rotas apenas na interface. **Não há tokens, sessões ou controle de acesso no servidor**: o mecanismo existe somente para a demonstração acadêmica.

## Testes

Os testes ficam em `backend/src` e são executados com Vitest (`npm test`):

- `algorithms/algorithms.test.ts`: os cinco algoritmos com `[]`, `[1]`, `[1,2]`, `[2,1]`, `[1,1,1]`, `[5,4,3,2,1]` e outros vetores; objetos `Aluno` por todos os critérios; equivalência entre algoritmos; complexidade observada por cenário.
- `api.test.ts`: regras de média e situação, dados de demonstração, login, listagens, filtros, paginação, CRUD, ranking, laboratório, estatísticas, relatórios e alertas. Os testes trabalham sobre uma cópia temporária de `data/`, sem alterar os arquivos do projeto.
