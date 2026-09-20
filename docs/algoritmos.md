# Algoritmos de ordenação

Todos os algoritmos foram implementados manualmente em `backend/src/algorithms/`, sem `Array.sort()`, e compartilham a mesma assinatura:

```ts
function algoritmo<T>(dados: T[], ctx: SortContext<T>): T[]
```

O `SortContext` (`context.ts`) encapsula o comparador e é o único ponto pelo qual os algoritmos comparam, trocam e movem elementos. Assim as métricas são contadas de forma idêntica para todos.

## Camada genérica

```ts
sort(dados, algoritmo, comparador): { data, metrics }
```

- recebe o vetor original e **ordena uma cópia**, nunca o original;
- `algoritmo`: `'bubble' | 'selection' | 'insertion' | 'merge' | 'quick'`;
- `comparador`: função `(a, b) => número`; os critérios prontos estão em `comparators.ts` (`nome`, `matricula`, `nota`, `frequencia`, crescente ou decrescente). Empates são desempatados pelo `id`, o que produz uma ordem total e faz todos os algoritmos (inclusive os instáveis) gerarem exatamente o mesmo resultado.

## Métricas

```json
{
  "algorithm": "Quick Sort",
  "comparisons": 8234,
  "swaps": 3120,
  "movements": 9410,
  "executionTime": 4.21
}
```

| Métrica       | Definição                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------- |
| `comparisons` | Chamadas ao comparador                                                                        |
| `swaps`       | Trocas de duas posições do vetor (uma troca de posições iguais não é contada)                 |
| `movements`   | Escritas de elementos no vetor: cada troca vale 2; cada deslocamento/inserção/intercalação vale 1 |
| `executionTime` | Milissegundos medidos com `performance.now()`                                               |

Insertion Sort e Merge Sort não trocam elementos: eles deslocam ou intercalam. Por isso aparecem com 0 trocas e são comparados pelas movimentações. No laboratório o tempo exibido é a **mediana de 5 execuções**, após 1 execução de aquecimento, para reduzir o ruído do JIT.

## Cópia dos dados

O laboratório monta o conjunto de dados uma única vez (sorteando alunos e aplicando o cenário) e chama `sort()` para cada algoritmo com esse mesmo vetor original. Como `sort()` sempre copia, cada algoritmo recebe uma cópia limpa:

```text
dados originais
 ├── cópia → Bubble
 ├── cópia → Selection
 ├── cópia → Insertion
 ├── cópia → Merge
 └── cópia → Quick
```

## Complexidade

| Algoritmo      | Melhor     | Médio      | Pior       | Espaço   | Estável |
| -------------- | ---------- | ---------- | ---------- | -------- | ------- |
| Bubble Sort    | O(n)       | O(n²)      | O(n²)      | O(1)     | Sim     |
| Selection Sort | O(n²)      | O(n²)      | O(n²)      | O(1)     | Não     |
| Insertion Sort | O(n)       | O(n²)      | O(n²)      | O(1)     | Sim     |
| Merge Sort     | O(n log n) | O(n log n) | O(n log n) | O(n)     | Sim     |
| Quick Sort     | O(n log n) | O(n log n) | O(n²)      | O(log n) | Não     |

## Descrição

### Bubble Sort (`bubbleSort.ts`)
Percorre o vetor comparando pares adjacentes e trocando os que estão fora de ordem; a cada passada o maior elemento restante "flutua" para o fim. Uma variável de controle interrompe o algoritmo quando uma passada não realiza trocas, o que dá o melhor caso O(n) em dados já ordenados (n − 1 comparações).

### Selection Sort (`selectionSort.ts`)
Em cada iteração procura o menor elemento da parte não ordenada e o troca com o primeiro dela. Faz sempre n(n − 1)/2 comparações, independentemente dos dados, mas no máximo n − 1 trocas.

### Insertion Sort (`insertionSort.ts`)
Mantém um prefixo ordenado e insere o próximo elemento na posição correta, deslocando para a direita os maiores. Em dados ordenados faz apenas n − 1 comparações; em dados invertidos, cerca de n²/2 comparações e deslocamentos.

### Merge Sort (`mergeSort.ts`)
Divide o vetor ao meio recursivamente e intercala as metades ordenadas usando um vetor auxiliar. Sempre O(n log n), estável, ao custo de O(n) de memória. Na intercalação, em caso de empate, o elemento da esquerda é escolhido, preservando a estabilidade.

### Quick Sort (`quickSort.ts`)
Particiona o vetor em torno de um pivô (esquema de Lomuto, com o **último elemento** como pivô) e ordena as partições recursivamente. A recursão é feita sobre a menor partição e a maior é tratada em laço, limitando a pilha a O(log n). Como o pivô é o último elemento, dados **ordenados** ou **inversamente ordenados** produzem partições totalmente desbalanceadas e o custo cai para O(n²); esse é o comportamento que o laboratório permite observar.

## O que observar no laboratório

Com 2.000 elementos e o critério *nota*:

| Cenário     | Bubble         | Selection      | Insertion      | Merge  | Quick          |
| ----------- | -------------- | -------------- | -------------- | ------ | -------------- |
| Aleatório   | ~2·10⁶ comp.   | 1.999.000 comp.| ~10⁶ comp.     | ~19 mil| ~30 mil comp.  |
| Ordenado    | 1.999 comp.    | 1.999.000 comp.| 1.999 comp.    | ~10 mil| ~2·10⁶ comp.   |
| Inverso     | 1.999.000 comp.| 1.999.000 comp.| 1.999.000 comp.| ~11 mil| ~2·10⁶ comp.   |

Os valores exatos variam a cada execução no cenário aleatório (os alunos são sorteados novamente). As tabelas e gráficos da interface mostram os números reais da execução.

## Mediana e estatísticas

A mediana é calculada ordenando as médias com o Merge Sort: com quantidade ímpar de registros, usa-se o elemento central; com quantidade par, a média dos dois elementos centrais. A maior e a menor nota são os extremos do vetor ordenado.

## Busca

O laboratório também compara a **busca sequencial** (O(n)) com a **busca binária** (O(log n)) por matrícula. A busca binária só funciona sobre dados ordenados, então o vetor é ordenado antes (Merge Sort) e o custo dessa ordenação é exibido separadamente.

## Modo apresentação

`services/laboratorio.ts` registra cada comparação, troca e movimentação por meio de um observador passado a `sort()`. O frontend reproduz esses quadros em um gráfico de barras, com controles de reprodução, pausa, passo a passo e velocidade. As métricas finais são medidas em uma execução separada, sem o custo do registro.
