<div align="center">
  <h2>🎓 Sistema de Ranking e Gestão Acadêmica</h2>
</div>

<div align="center">
  <h3>Estruturas de Dados 2 — Algoritmos de Ordenação</h3>
</div>

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/eda2-2026/G07_Ordenacao_EDA2-2026.2?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/eda2-2026/G07_Ordenacao_EDA2-2026.2?style=for-the-badge)
![Status](https://img.shields.io/badge/STATUS-Em%20Andamento-yellow?style=for-the-badge)
![Disciplina](https://img.shields.io/badge/DISCIPLINA-EDA2-4f46e5?style=for-the-badge)
![Dados](https://img.shields.io/badge/DADOS-Fict%C3%ADcios-0ea5e9?style=for-the-badge)

</div>

<div align="center">
  <h2>📑 Índice</h2>
</div>

- [🎯 Objetivos](#-objetivos)
- [📖 Sobre o projeto](#-sobre-o-projeto)
- [👩🏾‍💻 Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias](#️-tecnologias)
- [🤞 Como executar o projeto](#-como-executar-o-projeto)
- [⚙️ Configurações do projeto](#️-configurações-do-projeto)
- [🔐 Login demonstrativo](#-login-demonstrativo)
- [📊 Algoritmos](#-algoritmos)
- [🎥 Apresentação](#-apresentação)
- [👩‍💻 Contribuidores](#-contribuidores)
- [🧑‍💻 Estrutura do projeto](#-estrutura-do-projeto)
- [🧪 Testes](#-testes)

<div align="center">
  <h2>🎯 Objetivos</h2>
</div>

Este projeto foi desenvolvido para a disciplina **Estruturas de Dados 2 (EDA2)** e tem como objetivo demonstrar, de forma prática e visual, o uso de **estruturas de dados** e de **algoritmos de ordenação** em um sistema de gestão acadêmica.

- 🧠 **Objetivo acadêmico:** aplicar e comparar algoritmos de ordenação em um problema realista (ranking de 2.000 alunos).
- 🗂️ **Estruturas utilizadas:** vetores, tabelas hash (`Map`) para indexação por `id`, registros/objetos, e persistência em arquivos JSON.
- ⚙️ **Algoritmos:** Bubble Sort, Selection Sort, Insertion Sort, Merge Sort e Quick Sort, todos implementados manualmente, sem `Array.sort()`.
- 📈 **Comparação de desempenho:** contagem de comparações, trocas, movimentações e tempo de execução, em três cenários (aleatório, ordenado e inversamente ordenado).
- 🎓 **Aplicação prática:** ranking, mediana, relatórios e alertas acadêmicos que dependem diretamente da ordenação.

<div align="center">
  <h2>📖 Sobre o projeto</h2>
</div>

Na disciplina de Estruturas de Dados 2, algoritmos de ordenação costumam ser estudados apenas de forma teórica. O desafio deste projeto é **mostrar o comportamento real** de cada algoritmo sobre dados que fazem sentido para o usuário.

**A solução** é um sistema web de gestão acadêmica em que a ordenação é o núcleo do funcionamento:

- 📁 os dados ficam em **arquivos JSON** (`data/`), sem banco de dados, e são carregados em memória;
- 👨‍🎓 existem **2.000 alunos fictícios**, **50 professores**, **30 disciplinas** e cerca de **10 mil lançamentos de notas**;
- 🏆 o **ranking** de alunos é calculado por qualquer um dos cinco algoritmos, por média, nome, matrícula ou frequência, em ordem crescente ou decrescente;
- 🧪 o **Laboratório de Algoritmos de Ordenação** executa os cinco algoritmos sobre cópias idênticas dos mesmos dados (100, 500, 1.000 ou 2.000 alunos) e apresenta tabelas e gráficos de desempenho;
- 🎥 o **Modo Apresentação** anima passo a passo a execução de cada algoritmo.

<div align="center">
  <h2>👩🏾‍💻 Funcionalidades</h2>
</div>

- 🔐 **Login demonstrativo** com três usuários fictícios.
- 🏠 **Dashboard** com totais, média geral, taxas de aprovação/recuperação/reprovação, frequência média e gráficos (distribuição das notas, situação acadêmica, média por disciplina e por curso).
- 👨‍🎓 **Alunos:** listar, pesquisar, filtrar, cadastrar, editar, excluir e ver detalhes (com as notas do aluno).
- 👨‍🏫 **Professores:** listar, pesquisar, cadastrar, editar, excluir e visualizar, com as disciplinas ministradas.
- 📚 **Disciplinas:** cadastrar, editar, excluir, pesquisar e filtrar.
- 📝 **Notas:** selecionar aluno, disciplina e professor, lançar e editar notas e frequência, com cálculo automático da média e da situação.
- 🏆 **Ranking:** posição, aluno, curso, média, frequência e status; ordenação por média, nome, matrícula ou frequência, crescente ou decrescente, com escolha do algoritmo e exibição das métricas da ordenação.
- ⚙️ **Algoritmos** implementados manualmente, com camada genérica `sort(dados, algoritmo, comparador)`.
- 📊 **Métricas:** comparações, trocas, movimentações e tempo de execução.
- 🧪 **Laboratório (`/ordenacao`):** tamanhos 100/500/1.000/2.000, cenários aleatório/ordenado/inverso, critérios nome/matrícula/nota/frequência, comparação dos três cenários e busca sequencial × binária.
- 📈 **Gráficos de desempenho** de tempo, comparações, trocas e movimentações, com escala logarítmica opcional.
- 📐 **Tabela de complexidade** (melhor, médio e pior caso) na interface.
- 📑 **Relatórios (`/relatorios`):** desempenho acadêmico, por disciplina, por curso e Top 10 / Bottom 10, com exportação CSV.
- 🚨 **Alertas:** alunos com média < 5 ou frequência < 75%, com o motivo.
- 📊 **Estatísticas:** maior e menor nota, média, mediana (calculada sobre dados ordenados), aprovados, recuperação, reprovados e frequência média.
- 🔎 **Pesquisa** por nome e matrícula e **filtros** por curso, período, status, disciplina e professor.
- 📄 **Paginação** de 20 a 25 registros por página.
- 🎥 **Modo Apresentação:** visualização passo a passo com quantidade de elementos, algoritmo, critério, tempo, comparações, trocas e resultado.
- ✨ **UX:** carregamento, estados vazios, mensagens de sucesso e erro, confirmação antes de excluir, validação de formulários e layout responsivo.

<div align="center">
  <h2>🛠️ Tecnologias</h2>
</div>

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=for-the-badge)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

</div>


<div align="center">
  <h2>🤞 Como executar o projeto</h2>
</div>

### 1. Pré-requisitos

Instale (se ainda não tiver):

- **Node.js** (versão 20 ou superior; já inclui o npm): https://nodejs.org/pt
- **npm**: instalado junto com o Node.js. Para conferir, abra um terminal e execute `node -v` e `npm -v`.

Não é necessário Docker, banco de dados nem configuração de variáveis de ambiente.

### 2. Instalação

Abra um terminal **na pasta do projeto** (a pasta que contém este README) e execute:

```bash
npm install
```

Esse único comando instala as dependências do frontend e do backend.

### 3. Executar

```bash
npm run dev
```

Esse único comando inicia o backend e o frontend juntos. Aguarde aparecerem as mensagens de que os servidores estão prontos e abra no navegador:

👉 **http://localhost:5173**

Entre com um dos usuários da seção [Login demonstrativo](#-login-demonstrativo). Para encerrar, pressione `Ctrl + C` no terminal.

### Executar em modo "produção" (opcional)

```bash
npm start
```

Gera o build e serve tudo pela porta do backend: **http://localhost:3001**.

<div align="center">
  <h2>⚙️ Configurações do projeto</h2>
</div>

| Item        | Detalhe                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------- |
| Estrutura   | Monorepositório com dois pacotes (`frontend` e `backend`) gerenciados por *npm workspaces* |
| Dados       | Pasta `data/` com `alunos.json`, `professores.json`, `disciplinas.json`, `notas.json` e `usuarios.json` |
| Persistência| Os JSON são lidos uma vez ao iniciar e regravados a cada cadastro, edição ou exclusão      |
| Portas      | Frontend `5173` · Backend/API `3001` (o Vite encaminha `/api` para o backend)              |

**Scripts (na raiz do projeto)**

| Comando              | O que faz                                                       |
| -------------------- | --------------------------------------------------------------- |
| `npm install`        | Instala todas as dependências                                   |
| `npm run dev`        | Inicia backend e frontend em modo de desenvolvimento            |
| `npm run build`      | Compila o backend e gera o build do frontend                    |
| `npm start`          | Build + servidor único na porta 3001                            |
| `npm test`           | Executa os testes automatizados                                 |
| `npm run typecheck`  | Verifica os tipos do TypeScript (backend e frontend)            |
| `npm run gerar-dados`| Regera os dados fictícios em `data/`                            |

**Restaurar os dados originais:** execute `npm run gerar-dados`. A geração usa uma semente fixa, então os dados são sempre os mesmos.

**Alterar portas (opcional):** defina a variável `PORT` para a API (por exemplo, `PORT=4000`) e ajuste o destino do `proxy` em `frontend/vite.config.ts`.

<div align="center">
  <h2>🔐 Login demonstrativo</h2>
</div>


> ⚠️ **Este sistema utiliza autenticação simulada exclusivamente para fins acadêmicos.** O sistema de autenticação é exclusivamente demonstrativo e não possui finalidade de segurança ou produção.

<div align="center">
  <img src="docs/img/login.png" alt="Tela de login" width="70%"/>
</div>

<div align="center">
  <h2>📊 Algoritmos</h2>
</div>


- 🫧 **Bubble Sort:** compara pares adjacentes e os troca quando estão fora de ordem. Termina cedo se uma passada não fizer trocas (por isso é O(n) em dados ordenados).
- 🎯 **Selection Sort:** seleciona o menor elemento da parte não ordenada e o coloca na posição correta. Faz poucas trocas, mas sempre o mesmo número de comparações.
- 🃏 **Insertion Sort:** insere cada elemento na posição correta dentro do prefixo já ordenado. Muito bom para dados quase ordenados.
- 🧩 **Merge Sort:** divide o vetor ao meio, ordena cada metade e intercala. Desempenho previsível e estável, com uso de memória auxiliar.
- ⚡ **Quick Sort:** particiona o vetor em torno de um pivô (aqui, o último elemento) e ordena as partições. Muito rápido em média, mas degenera para O(n²) em dados ordenados com esse pivô.

Detalhes de implementação, definição das métricas e resultados esperados: [`docs/algoritmos.md`](docs/algoritmos.md).

<div align="center">
  <h2>🎥 Apresentação</h2>
</div>

<div align="center">
  <a href="https://youtu.be/5eIOjBwUeOA">
    <img src="https://img.shields.io/badge/YouTube-Apresentação-red?style=for-the-badge&logo=youtube&logoColor=white" alt="Apresentação no YouTube">
  </a>
</div>


  <h2>👩‍💻 Contribuidores</h2>
</div>

<div align="center">
  <table align="center">
    <tr>
      <td align="center">
        <a href="https://github.com/xGabrielCv">
          <img src="https://github.com/xGabrielCv.png" width="80"/><br/>
          <sub><b>Jésus Gabriel Carvalho Ventura</b></sub>
        </a><br/>
        <sub>jgabrielcv1903@gmail.com</sub>
      </td>
      <td align="center">
        <a href="https://github.com/ArturDCR">
          <img src="https://github.com/ArturDCR.png" width="80"/><br/>
          <sub><b>Artur de Camargos</b></sub>
        </a><br/>
        <sub>arturdecamargos@gmail.com</sub>
      </td>
    </tr>
  </table>
</div>
