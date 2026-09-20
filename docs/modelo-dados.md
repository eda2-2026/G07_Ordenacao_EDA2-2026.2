# Modelo de dados

Os dados ficam em arquivos JSON na pasta `data/`. Cada arquivo é um vetor de objetos, um por linha, e todos possuem o campo numérico `id`. Todos os dados são **fictícios**, gerados por `backend/src/scripts/gerarDados.ts` com uma semente fixa (reprodutível).

| Arquivo             | Registros | Conteúdo                       |
| ------------------- | --------- | ------------------------------ |
| `alunos.json`       | 2.000     | Alunos                         |
| `professores.json`  | 50        | Professores                    |
| `disciplinas.json`  | 30        | Disciplinas                    |
| `notas.json`        | ~10 mil   | Lançamentos de notas           |
| `usuarios.json`     | 3         | Usuários do login demonstrativo |

## Relacionamentos

```text
Professor 1 ────── N Disciplina
Aluno     1 ────── N Nota N ────── 1 Disciplina
                        N ────── 1 Professor
```

Cada aluno possui de 4 a 6 lançamentos, em disciplinas coerentes com o seu período. Só existe um lançamento por par (aluno, disciplina).

## Aluno

| Campo       | Tipo   | Descrição                                        |
| ----------- | ------ | ------------------------------------------------ |
| `id`        | number | Identificador                                    |
| `nome`      | string | Nome completo                                    |
| `matricula` | string | Única (`ano` + `semestre` + sequência)           |
| `email`     | string | E-mail fictício (domínio `exemplo.edu.br`)       |
| `idade`     | number | 14 a 100                                         |
| `curso`     | string | Um dos 8 cursos                                  |
| `periodo`   | number | 1 a 10                                           |
| `status`    | string | `Ativo`, `Trancado` ou `Inativo`                 |

Cursos: Ciência da Computação, Engenharia de Software, Sistemas de Informação, Engenharia Elétrica, Engenharia Civil, Matemática, Física e Administração.

## Professor

| Campo           | Tipo   | Descrição                                   |
| --------------- | ------ | ------------------------------------------- |
| `id`            | number | Identificador                               |
| `nome`          | string | Nome completo                               |
| `matricula`     | string | Única (`P` + 5 dígitos)                     |
| `email`         | string | E-mail fictício                             |
| `especialidade` | string | Área de atuação                             |
| `departamento`  | string | Um dos 5 departamentos                      |
| `status`        | string | `Ativo`, `Afastado` ou `Inativo`            |

Departamentos: Computação, Matemática e Estatística, Ciências Exatas, Engenharias e Administração e Economia.

## Disciplina

| Campo          | Tipo   | Descrição                           |
| -------------- | ------ | ----------------------------------- |
| `id`           | number | Identificador                       |
| `codigo`       | string | Único, em maiúsculas (ex.: `CMP301`) |
| `nome`         | string | Nome da disciplina                  |
| `cargaHoraria` | number | Horas (15 a 400)                    |
| `periodo`      | number | 1 a 10                              |
| `professorId`  | number | Professor responsável               |
| `status`       | string | `Ativa` ou `Inativa`                |

## Nota

| Campo          | Tipo   | Descrição                                          |
| -------------- | ------ | -------------------------------------------------- |
| `id`           | number | Identificador                                      |
| `alunoId`      | number | Aluno                                              |
| `disciplinaId` | number | Disciplina                                         |
| `professorId`  | number | Professor que lançou                               |
| `nota1..3`     | number | De 0 a 10                                          |
| `media`        | number | `(nota1 + nota2 + nota3) / 3`, com 2 casas         |
| `frequencia`   | number | De 0 a 100 (%)                                     |
| `status`       | string | Situação calculada pelo servidor                   |

`media` e `status` são **sempre recalculados pelo servidor** ao criar ou editar um lançamento; valores enviados pelo cliente são ignorados.

### Regras de situação

| Condição                             | Situação                    |
| ------------------------------------ | --------------------------- |
| Frequência < 75%                     | Reprovado por Frequência    |
| Média ≥ 7,0                          | Aprovado                    |
| Média ≥ 5,0 e < 7,0                  | Recuperação                 |
| Média < 5,0                          | Reprovado                   |

A regra de frequência tem prioridade sobre a média. Nos indicadores, "reprovados" soma Reprovado e Reprovado por Frequência.

## Dados agregados por aluno

Ranking, alertas e laboratório usam um resumo por aluno (`AlunoRanking`), calculado a partir dos lançamentos: **média geral** (média das médias), **frequência média** e a situação obtida aplicando as mesmas regras a esses dois valores. Alunos sem lançamentos não entram no ranking.

## Usuários (demonstração)

`usuarios.json` guarda usuário, senha em texto puro e perfil (`admin`, `professor`, `coordenador`). São credenciais fictícias e públicas, usadas exclusivamente para a demonstração; não existe nenhuma proteção real.

## Regenerar os dados

```bash
npm run gerar-dados
```

Sobrescreve os cinco arquivos de `data/` com os dados originais de demonstração.

## Regras de exclusão

- Excluir um **aluno** ou uma **disciplina** remove também os lançamentos de notas relacionados.
- Excluir um **professor** é bloqueado (`409`) enquanto houver disciplinas ou lançamentos vinculados a ele.
