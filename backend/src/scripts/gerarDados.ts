import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '../config';
import { serializar } from '../store/repositorio';
import { calcularMedia, determinarStatus, normalizarTexto, round } from '../rules';
import { Aluno, CURSOS, DEPARTAMENTOS, Disciplina, Nota, Professor, StatusAluno, Usuario } from '../types';

const TOTAL_ALUNOS = 2000;
const TOTAL_PROFESSORES = 50;

function criarAleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const aleatorio = criarAleatorio(20262);

function inteiro(min: number, max: number): number {
  return Math.floor(aleatorio() * (max - min + 1)) + min;
}

function escolher<T>(lista: readonly T[]): T {
  return lista[Math.floor(aleatorio() * lista.length)];
}

function normal(media: number, desvio: number): number {
  const u = 1 - aleatorio();
  const v = aleatorio();
  return media + desvio * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

function embaralhar<T>(lista: readonly T[]): T[] {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    const temp = copia[i];
    copia[i] = copia[j];
    copia[j] = temp;
  }
  return copia;
}

const NOMES_MASCULINOS = [
  'João', 'Pedro', 'Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Guilherme', 'Felipe', 'Bruno', 'Thiago',
  'Carlos', 'Eduardo', 'Rodrigo', 'Leonardo', 'Gustavo', 'Vinícius', 'Daniel', 'André', 'Marcelo', 'Fernando',
  'Ricardo', 'Diego', 'Henrique', 'Caio', 'Renato', 'Otávio', 'Samuel', 'Davi', 'Miguel', 'Arthur',
  'Heitor', 'Bernardo', 'Enzo', 'Nicolas', 'Igor', 'Leandro', 'Márcio', 'Sérgio', 'Alexandre', 'Paulo'
];

const NOMES_FEMININOS = [
  'Maria', 'Ana', 'Beatriz', 'Julia', 'Larissa', 'Camila', 'Fernanda', 'Amanda', 'Letícia', 'Mariana',
  'Gabriela', 'Isabela', 'Carolina', 'Patrícia', 'Renata', 'Aline', 'Bruna', 'Vanessa', 'Juliana', 'Priscila',
  'Natália', 'Rafaela', 'Luana', 'Sabrina', 'Débora', 'Tatiana', 'Helena', 'Alice', 'Laura', 'Sofia',
  'Valentina', 'Manuela', 'Cecília', 'Clara', 'Yasmin', 'Lívia', 'Marina', 'Bianca', 'Elisa', 'Vitória'
];

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
  'Cardoso', 'Ramos', 'Teixeira', 'Araújo', 'Correia', 'Pinto', 'Monteiro', 'Moura', 'Cavalcanti', 'Batista',
  'Campos', 'Miranda', 'Azevedo', 'Farias', 'Castro', 'Duarte', 'Borges', 'Medeiros', 'Barros', 'Peixoto'
];

function gerarNome(usados: Set<string>): string {
  for (;;) {
    const primeiro = aleatorio() < 0.5 ? escolher(NOMES_MASCULINOS) : escolher(NOMES_FEMININOS);
    const partes = [primeiro, escolher(SOBRENOMES)];
    if (aleatorio() < 0.75) partes.push(escolher(SOBRENOMES));
    const nome = partes.join(' ');
    if (!usados.has(nome)) {
      usados.add(nome);
      return nome;
    }
  }
}

function slugEmail(nome: string): string {
  const partes = normalizarTexto(nome).split(/\s+/);
  return `${partes[0]}.${partes[partes.length - 1]}`;
}

const ESPECIALIDADES: Record<string, string[]> = {
  'Computação': [
    'Algoritmos e Estruturas de Dados', 'Engenharia de Software', 'Banco de Dados', 'Redes de Computadores',
    'Inteligência Artificial', 'Sistemas Operacionais', 'Segurança da Informação', 'Computação Gráfica'
  ],
  'Matemática e Estatística': [
    'Álgebra Linear', 'Cálculo Diferencial', 'Estatística Aplicada', 'Matemática Discreta', 'Análise Numérica'
  ],
  'Ciências Exatas': ['Física Clássica', 'Eletromagnetismo', 'Química Geral', 'Física Moderna', 'Mecânica'],
  'Engenharias': [
    'Circuitos Elétricos', 'Estruturas de Concreto', 'Termodinâmica', 'Materiais de Construção', 'Sistemas de Potência'
  ],
  'Administração e Economia': [
    'Gestão de Projetos', 'Contabilidade', 'Microeconomia', 'Finanças Corporativas', 'Marketing'
  ]
};

const PROFESSORES_POR_DEPARTAMENTO: Record<string, number> = {
  'Computação': 16,
  'Matemática e Estatística': 9,
  'Ciências Exatas': 8,
  'Engenharias': 9,
  'Administração e Economia': 8
};

interface ModeloDisciplina {
  codigo: string;
  nome: string;
  cargaHoraria: number;
  periodo: number;
  departamento: string;
  dificuldade: number;
}

const MODELOS_DISCIPLINAS: ModeloDisciplina[] = [
  { codigo: 'CMP101', nome: 'Introdução à Programação', cargaHoraria: 80, periodo: 1, departamento: 'Computação', dificuldade: 0 },
  { codigo: 'CMP201', nome: 'Estruturas de Dados 1', cargaHoraria: 80, periodo: 2, departamento: 'Computação', dificuldade: -0.3 },
  { codigo: 'CMP202', nome: 'Programação Orientada a Objetos', cargaHoraria: 80, periodo: 3, departamento: 'Computação', dificuldade: 0.1 },
  { codigo: 'CMP301', nome: 'Estruturas de Dados 2', cargaHoraria: 80, periodo: 3, departamento: 'Computação', dificuldade: -0.5 },
  { codigo: 'CMP302', nome: 'Banco de Dados', cargaHoraria: 60, periodo: 4, departamento: 'Computação', dificuldade: 0.2 },
  { codigo: 'CMP303', nome: 'Sistemas Operacionais', cargaHoraria: 60, periodo: 4, departamento: 'Computação', dificuldade: -0.2 },
  { codigo: 'CMP403', nome: 'Arquitetura de Computadores', cargaHoraria: 60, periodo: 4, departamento: 'Computação', dificuldade: -0.1 },
  { codigo: 'CMP401', nome: 'Redes de Computadores', cargaHoraria: 60, periodo: 5, departamento: 'Computação', dificuldade: 0.1 },
  { codigo: 'CMP402', nome: 'Engenharia de Software', cargaHoraria: 60, periodo: 5, departamento: 'Computação', dificuldade: 0.4 },
  { codigo: 'CMP502', nome: 'Segurança da Informação', cargaHoraria: 60, periodo: 6, departamento: 'Computação', dificuldade: 0.3 },
  { codigo: 'CMP501', nome: 'Inteligência Artificial', cargaHoraria: 80, periodo: 7, departamento: 'Computação', dificuldade: -0.2 },
  { codigo: 'MAT101', nome: 'Cálculo I', cargaHoraria: 120, periodo: 1, departamento: 'Matemática e Estatística', dificuldade: -0.7 },
  { codigo: 'MAT202', nome: 'Matemática Discreta', cargaHoraria: 60, periodo: 1, departamento: 'Matemática e Estatística', dificuldade: -0.2 },
  { codigo: 'MAT102', nome: 'Cálculo II', cargaHoraria: 120, periodo: 2, departamento: 'Matemática e Estatística', dificuldade: -0.8 },
  { codigo: 'MAT201', nome: 'Álgebra Linear', cargaHoraria: 80, periodo: 2, departamento: 'Matemática e Estatística', dificuldade: -0.4 },
  { codigo: 'MAT301', nome: 'Estatística e Probabilidade', cargaHoraria: 60, periodo: 3, departamento: 'Matemática e Estatística', dificuldade: -0.1 },
  { codigo: 'MAT302', nome: 'Cálculo Numérico', cargaHoraria: 60, periodo: 4, departamento: 'Matemática e Estatística', dificuldade: -0.3 },
  { codigo: 'QUI101', nome: 'Química Geral', cargaHoraria: 80, periodo: 1, departamento: 'Ciências Exatas', dificuldade: 0.1 },
  { codigo: 'FIS101', nome: 'Física I', cargaHoraria: 80, periodo: 2, departamento: 'Ciências Exatas', dificuldade: -0.6 },
  { codigo: 'FIS201', nome: 'Física II', cargaHoraria: 80, periodo: 3, departamento: 'Ciências Exatas', dificuldade: -0.6 },
  { codigo: 'FIS202', nome: 'Mecânica Clássica', cargaHoraria: 60, periodo: 3, departamento: 'Ciências Exatas', dificuldade: -0.4 },
  { codigo: 'FIS301', nome: 'Eletromagnetismo', cargaHoraria: 60, periodo: 4, departamento: 'Ciências Exatas', dificuldade: -0.5 },
  { codigo: 'ENG201', nome: 'Circuitos Elétricos', cargaHoraria: 80, periodo: 4, departamento: 'Engenharias', dificuldade: -0.3 },
  { codigo: 'ENG202', nome: 'Resistência dos Materiais', cargaHoraria: 80, periodo: 4, departamento: 'Engenharias', dificuldade: -0.4 },
  { codigo: 'ENG301', nome: 'Termodinâmica', cargaHoraria: 60, periodo: 5, departamento: 'Engenharias', dificuldade: -0.3 },
  { codigo: 'ENG302', nome: 'Instalações Elétricas', cargaHoraria: 60, periodo: 6, departamento: 'Engenharias', dificuldade: 0.2 },
  { codigo: 'ADM101', nome: 'Introdução à Administração', cargaHoraria: 60, periodo: 1, departamento: 'Administração e Economia', dificuldade: 0.5 },
  { codigo: 'ADM201', nome: 'Contabilidade Geral', cargaHoraria: 60, periodo: 2, departamento: 'Administração e Economia', dificuldade: 0.1 },
  { codigo: 'ECO101', nome: 'Economia', cargaHoraria: 60, periodo: 3, departamento: 'Administração e Economia', dificuldade: 0.2 },
  { codigo: 'ADM301', nome: 'Gestão de Projetos', cargaHoraria: 60, periodo: 5, departamento: 'Administração e Economia', dificuldade: 0.5 }
];

function gerarProfessores(): Professor[] {
  const usados = new Set<string>();
  const professores: Professor[] = [];
  let id = 1;
  for (const departamento of DEPARTAMENTOS) {
    const quantidade = PROFESSORES_POR_DEPARTAMENTO[departamento];
    const especialidades = ESPECIALIDADES[departamento];
    for (let i = 0; i < quantidade; i++) {
      const nome = gerarNome(usados);
      const status = id % 17 === 0 ? 'Afastado' : id === TOTAL_PROFESSORES ? 'Inativo' : 'Ativo';
      professores.push({
        id,
        nome,
        matricula: `P${String(10000 + id)}`,
        email: `${slugEmail(nome)}.p${id}@prof.exemplo.edu.br`,
        especialidade: especialidades[i % especialidades.length],
        departamento,
        status
      });
      id++;
    }
  }
  return professores;
}

function gerarDisciplinas(professores: Professor[]): Disciplina[] {
  const contadores: Record<string, number> = {};
  return MODELOS_DISCIPLINAS.map((modelo, indice) => {
    const doDepartamento = professores.filter(
      (p) => p.departamento === modelo.departamento && p.status === 'Ativo'
    );
    const passo = contadores[modelo.departamento] ?? 0;
    contadores[modelo.departamento] = passo + 1;
    const professor = doDepartamento[(passo * 2) % doDepartamento.length];
    return {
      id: indice + 1,
      codigo: modelo.codigo,
      nome: modelo.nome,
      cargaHoraria: modelo.cargaHoraria,
      periodo: modelo.periodo,
      professorId: professor.id,
      status: 'Ativa'
    };
  });
}

interface AlunoGerado {
  aluno: Aluno;
  habilidade: number;
  assiduidade: number;
}

function gerarAlunos(): AlunoGerado[] {
  const usados = new Set<string>();
  const alunos: AlunoGerado[] = [];
  const pesosCurso = [16, 14, 12, 12, 10, 8, 8, 10];
  const totalPesos = pesosCurso.reduce((soma, peso) => soma + peso, 0);
  for (let i = 1; i <= TOTAL_ALUNOS; i++) {
    const nome = gerarNome(usados);
    let sorteio = aleatorio() * totalPesos;
    let indiceCurso = 0;
    while (sorteio >= pesosCurso[indiceCurso]) {
      sorteio -= pesosCurso[indiceCurso];
      indiceCurso++;
    }
    const periodo = inteiro(1, 10);
    const ingresso = 2025 - Math.floor((periodo - 1) / 2);
    const semestre = periodo % 2 === 1 ? 1 : 2;
    const sorteioStatus = aleatorio();
    const status: StatusAluno = sorteioStatus < 0.88 ? 'Ativo' : sorteioStatus < 0.95 ? 'Trancado' : 'Inativo';
    const emRisco = aleatorio() < 0.08;
    alunos.push({
      aluno: {
        id: i,
        nome,
        matricula: `${ingresso}${semestre}${String(i).padStart(4, '0')}`,
        email: `${slugEmail(nome)}.${i}@aluno.exemplo.edu.br`,
        idade: limitar(Math.round(17 + periodo / 2 + Math.abs(normal(1.5, 2.5)) + (aleatorio() < 0.08 ? inteiro(4, 15) : 0)), 17, 55),
        curso: CURSOS[indiceCurso],
        periodo,
        status
      },
      habilidade: emRisco ? normal(4.6, 0.9) : limitar(normal(7.4, 1.4), 2.5, 10),
      assiduidade: emRisco ? normal(72, 8) : normal(88, 6)
    });
  }
  return alunos;
}

function gerarNotas(alunos: AlunoGerado[], disciplinas: Disciplina[]): Nota[] {
  const notas: Nota[] = [];
  const dificuldades = new Map<number, number>();
  disciplinas.forEach((disciplina, indice) => dificuldades.set(disciplina.id, MODELOS_DISCIPLINAS[indice].dificuldade));
  let id = 1;
  for (const { aluno, habilidade, assiduidade } of alunos) {
    const disponiveis = disciplinas.filter((d) => d.periodo <= aluno.periodo && d.periodo >= aluno.periodo - 2);
    const base = disponiveis.length >= 4 ? disponiveis : disciplinas.filter((d) => d.periodo <= Math.max(aluno.periodo, 2));
    const quantidade = Math.min(inteiro(4, 6), base.length);
    const escolhidas = embaralhar(base).slice(0, quantidade);
    for (const disciplina of escolhidas) {
      const dificuldade = dificuldades.get(disciplina.id) ?? 0;
      const desempenho = habilidade + dificuldade;
      const nota1 = round(limitar(normal(desempenho, 1.1), 0, 10), 1);
      const nota2 = round(limitar(normal(desempenho, 1.1), 0, 10), 1);
      const nota3 = round(limitar(normal(desempenho, 1.1), 0, 10), 1);
      const frequencia = round(limitar(normal(assiduidade + (habilidade - 7) * 0.8, 4), 40, 100), 1);
      const media = calcularMedia(nota1, nota2, nota3);
      notas.push({
        id: id++,
        alunoId: aluno.id,
        disciplinaId: disciplina.id,
        professorId: disciplina.professorId,
        nota1,
        nota2,
        nota3,
        media,
        frequencia,
        status: determinarStatus(media, frequencia)
      });
    }
  }
  return notas;
}

function gerarUsuarios(): Usuario[] {
  return [
    { id: 1, usuario: 'admin', senha: 'admin123', nome: 'Administrador do Sistema', perfil: 'admin' },
    { id: 2, usuario: 'professor', senha: '123456', nome: 'Professor Demonstração', perfil: 'professor' },
    { id: 3, usuario: 'coordenador', senha: '123456', nome: 'Coordenador Demonstração', perfil: 'coordenador' }
  ];
}

function gravar(nome: string, itens: readonly unknown[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, nome), serializar(itens), 'utf-8');
  console.log(`${nome}: ${itens.length} registros`);
}

const professores = gerarProfessores();
const disciplinas = gerarDisciplinas(professores);
const alunosGerados = gerarAlunos();
const notas = gerarNotas(alunosGerados, disciplinas);

gravar('professores.json', professores);
gravar('disciplinas.json', disciplinas);
gravar('alunos.json', alunosGerados.map((g) => g.aluno));
gravar('notas.json', notas);
gravar('usuarios.json', gerarUsuarios());
