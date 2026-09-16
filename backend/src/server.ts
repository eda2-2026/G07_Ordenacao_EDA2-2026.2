import { criarApp } from './app';
import { PORT } from './config';

const app = criarApp();

app.listen(PORT, () => {
  console.log(`API do Sistema de Ranking e Gestão Acadêmica em http://localhost:${PORT}`);
});
