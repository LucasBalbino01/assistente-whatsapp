const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('web/public'));

/* ================= FUNÇÕES ================= */

function lerDados() {
  if (!fs.existsSync('data.json')) {
    fs.writeFileSync('data.json', JSON.stringify({
      gastos: [],
      lembretes: [],
      cofrinhos: [],
      contas: []
    }, null, 2));
  }

  const dados = JSON.parse(fs.readFileSync('data.json', 'utf8'));

  dados.gastos ||= [];
  dados.lembretes ||= [];
  dados.cofrinhos ||= [];
  dados.contas ||= [];

  return dados;
}

function salvarDados(dados) {
  fs.writeFileSync('data.json', JSON.stringify(dados, null, 2));
}

/* ================= ROTAS ================= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/views/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/views/login.html'));
});

app.post('/login', (req, res) => {
  const { telefone } = req.body;
  res.redirect('/dashboard/' + telefone);
});

app.get('/dashboard/:usuario', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/views/dashboard.html'));
});

/* ================= GASTOS ================= */

app.get('/api/dados/:usuario', (req, res) => {
  const dados = lerDados();
  res.json({
    movimentos: dados.gastos.filter(g => g.usuario === req.params.usuario)
  });
});

app.post('/api/gasto/:usuario', (req, res) => {
  const dados = lerDados();

  dados.gastos.push({
    id: Date.now(),
    usuario: req.params.usuario,
    descricao: req.body.descricao,
    categoria: req.body.categoria,
    valor: Number(req.body.valor),
    data: new Date().toLocaleDateString('pt-BR')
  });

  salvarDados(dados);
  res.json({ ok: true });
});

app.put('/api/gasto/:id', (req, res) => {
  const dados = lerDados();
  const g = dados.gastos.find(x => x.id == req.params.id);
  if (!g) return res.sendStatus(404);

  g.descricao = req.body.descricao;
  g.categoria = req.body.categoria;
  g.valor = Number(req.body.valor);

  salvarDados(dados);
  res.json({ ok: true });
});

app.delete('/api/gasto/:id', (req, res) => {
  const dados = lerDados();
  dados.gastos = dados.gastos.filter(g => g.id != req.params.id);
  salvarDados(dados);
  res.json({ ok: true });
});

/* ================= AGENDA ================= */

app.get('/api/lembretes/:usuario', (req, res) => {
  const dados = lerDados();
  res.json(dados.lembretes.filter(l => l.usuario === req.params.usuario));
});

app.post('/api/lembrete/:usuario', (req, res) => {
  const dados = lerDados();

  dados.lembretes.push({
    id: Date.now(),
    usuario: req.params.usuario,
    titulo: req.body.titulo,
    data: req.body.data,
    hora: req.body.hora
  });

  salvarDados(dados);
  res.json({ ok: true });
});

app.delete('/api/lembrete/:id', (req, res) => {
  const dados = lerDados();
  dados.lembretes = dados.lembretes.filter(l => l.id != req.params.id);
  salvarDados(dados);
  res.json({ ok: true });
});

/* ================= COFRINHO ================= */

app.get('/api/cofrinho/:usuario', (req, res) => {
  const dados = lerDados();
  res.json(dados.cofrinhos.filter(c => c.usuario === req.params.usuario));
});

app.post('/api/cofrinho/:usuario', (req, res) => {
  const dados = lerDados();

  dados.cofrinhos.push({
    id: Date.now(),
    usuario: req.params.usuario,
    nome: req.body.nome,
    total: Number(req.body.total),
    guardado: 0
  });

  salvarDados(dados);
  res.json({ ok: true });
});

app.put('/api/cofrinho/:id', (req, res) => {
  const dados = lerDados();
  const c = dados.cofrinhos.find(x => x.id == req.params.id);
  if (!c) return res.sendStatus(404);

  c.guardado += Number(req.body.valor);
  salvarDados(dados);
  res.json({ ok: true });
});

app.delete('/api/cofrinho/:id', (req, res) => {
  const dados = lerDados();
  dados.cofrinhos = dados.cofrinhos.filter(c => c.id != req.params.id);
  salvarDados(dados);
  res.json({ ok: true });
});

/* ================= CONTAS ================= */

app.get('/api/contas/:usuario', (req, res) => {
  const dados = lerDados();
  res.json(dados.contas.filter(c => c.usuario === req.params.usuario));
});

app.post('/api/conta/:usuario', (req, res) => {
  const dados = lerDados();

  dados.contas.push({
    id: Date.now(),
    usuario: req.params.usuario,
    descricao: req.body.descricao,
    valor: Number(req.body.valor),
    vencimento: req.body.vencimento
  });

  salvarDados(dados);
  res.json({ ok: true });
});

app.delete('/api/conta/:id', (req, res) => {
  const dados = lerDados();
  dados.contas = dados.contas.filter(c => c.id != req.params.id);
  salvarDados(dados);
  res.json({ ok: true });
});

/* ================= SERVIDOR ================= */

app.listen(PORT, () => {
  console.log(`🌐 Rodando em http://localhost:${PORT}`);
});
